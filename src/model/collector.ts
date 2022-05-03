import { Vault, MetadataCache, TFile, TAbstractFile, getLinkpath, CachedMetadata, FrontMatterCache, parseFrontMatterTags, parseFrontMatterStringArray, parseFrontMatterEntry, TFolder } from 'obsidian';
import { WSFile } from './file';
import type WordStatisticsPlugin from '../main';
import { WSProjectManager } from './manager';
import { WordCountForText } from '../words';
import { WSEvents, WSFileEvent } from 'src/event';
import { writable, Writable } from 'svelte/store';

interface LongformDraft {
    name: string;
    folder: string;
    scenes: string[];
}

export class WSDataCollector {
    plugin: WordStatisticsPlugin;
    vault: Vault;
    mdCache: MetadataCache;
    private fileMap: Map<string, WSFile>;
    private files: WSFile[];
    manager: WSProjectManager;
    lastUpdate: number = 0;
    queue: [Function, unknown[]][] = [];
    lastWords: number = 0;

    constructor(plugin: WordStatisticsPlugin, vault: Vault, metadataCache: MetadataCache) {
        this.plugin = plugin;
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFile>();
        this.files = [];
        this.lastUpdate = 0;
        this.manager = new WSProjectManager(plugin, this);
    }

    get totalWords() {
        return this.lastWords;
        let words = 0;
        this.files.forEach((file) => {
            words += file.words;
        });
        return words;
    }

    getAllTags() {
        let tags = new Set<string>();
        this.files.forEach((file) => {
            file.tags.forEach((tag) => {
                tags.add(tag);
            });
        });
        return Array.from(tags);
    }

    getAllPaths() {
        let paths:string[] = []
        this.vault.getMarkdownFiles().forEach((file) => {
            paths.push(file.path);
        })
        return paths.sort();
    }

    getAllFolders() {
        let folders = this.plugin.app.vault.getAllLoadedFiles().filter((t) => t instanceof TFolder)
        let paths: string[] = []
        folders.forEach((folder) => {
            paths.push(folder.path);
        })
        return paths.sort();
    }

    get fileList() {
        return Array.from(this.fileMap.values());
    }

    get pluginSettings() {
        return this.plugin.settings;
    }

    get totalFileCount() {
        return this.vault.getMarkdownFiles().length;
    }

    onRename(file: TAbstractFile, oldPath: string) {
        if (this.fileMap.has(oldPath) && file instanceof TFile) {
            let fi = this.fileMap.get(oldPath);
            this.fileMap.delete(oldPath);
            if (this.fileMap.has(file.path)) {
                console.log("!!! onRename('%s' to '%s'): New file path already exists!", oldPath, file.path);
                throw Error("Cannot rename file reference as new file path already in use.");
            }
            this.fileMap.set(file.path, fi);
            fi.name = file.basename;
            fi.path = file.path;
            this.plugin.app.workspace.trigger("word-statistics-file-renamed", fi);
        } else {
            console.log("!!! onRename('%s' to '%s'): Old file does not exist!", oldPath, file.path);
            let fi = this.getFile(file.path);
        }
        this.update();
    }

    onDelete(file: TAbstractFile) {
        // console.log(file);
        if (this.fileMap.has(file.path)) {
            let fi = this.fileMap.get(file.path);
            this.fileMap.delete(file.path);
            this.update();
        } else {
            console.log("!!! onDelete('%s'): File does not exist. Nothing to delete.", file.path);
        }
    }

    checkFMLongform(file: TFile, frontmatter: FrontMatterCache) {
        let longformDrafts: LongformDraft[] = [];
        if (frontmatter?.['drafts'] != undefined) {
            let drafts = frontmatter['drafts'];
            for (let draft of drafts) {
                longformDrafts.push(draft);
            }
        }
    }

    logWords(path: string, newCount: number) {
        if (this.fileMap.has(path)) {
            let file = this.fileMap.get(path);
            let oldCount = file.words;
            if (oldCount != newCount) {
                this.lastWords += newCount - oldCount;
                this.fileMap.get(path).setWords(newCount);
                this.update();
                this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.WordsChanged, file }, {filter: file}));
            }
            return;
        }
        console.log(`ERROR: Attempted to log words for path '${path}' but path not found in file map.`);
    }

    forceUpdateFile(file: WSFile) {
        let path = file.path;
        let af = this.vault.getAbstractFileByPath(path);
        if (af != null && af instanceof TFile) {
            this.updateFile(af);
        }
    }

    updateAllFiles() {
        this.files.forEach((file) => {
            this.forceUpdateFile(file);
        });
    }

    async executeDeferredItems() {
        while (this.queue.length > 0) {
            let [func, pack] = this.queue.shift();
            func(...pack);
        };
    }

    updateFile(file: TFile) {
        // console.log("UpdateFile(%s)", file.path);
        let fi = this.getFileSafer(file.path);
        // fi should never be null as we have a TFile we are updating.
        fi.setTitle(file.basename);
        let cache = this.plugin.app.metadataCache.getCache(file.path);
        if (cache === undefined || cache === null) {
            console.log(`Unable to update '${fi.path}. Cache is ${cache}.`);
            // this.queue.push([this.updateFile.bind(this), [file]]);
        } else {
            fi.setTitle(cache.frontmatter?.['title'] || file.basename);
            // this.checkFMLongform(file, cache.frontmatter);
            let tagCache = cache.tags;
            let tags: string[] = [];
            let fmTags = parseFrontMatterTags(cache.frontmatter);
            if (fmTags != null) {
                fmTags.forEach((item) => {
                    tags.push(item);
                });
            }
            if (tagCache != undefined && tagCache != null && tagCache.length > 0) {
                tagCache.forEach((tag) => {
                    tags.push(tag.tag);
                });
            }
            let oldTags = fi.tags;
            let newTags: string[] = [];
            tags.forEach((tag) => {
                if (oldTags.contains(tag)) {
                    oldTags.remove(tag);
                } else {
                    newTags.push(tag);
                }
            });
            fi.setTags(tags);
            // Now we need to alert any projects that use a tag that was changed (added/deleted) to update
            oldTags.forEach((tag) => {
                this.manager.updateProjectsForTag(tag);
            });
            newTags.forEach((tag) => {
                this.manager.updateProjectsForTag(tag);
            });
            if (this.manager.isIndexFile(fi)) {
                // update index
                let links = this.mdCache.getCache(file.path).links;
                let newLinks: [WSFile, string][] = [];
                for (let i = 0; i < links.length; i++) {
                    let link = links[i];
                    let linkPath = getLinkpath(link.link);
                    let linkedFile = this.mdCache.getFirstLinkpathDest(link.link, file.path);
                    // if there is no link, we don't want to add it to the list
                    if (linkedFile != null) {
                        let lFile = this.getFile(linkedFile.path);
                        let dText = link.displayText == lFile.name ? null : link.displayText;
                        newLinks.push([lFile, dText || lFile.title]);
                    }
                }
                // clear old links
                fi.clearLinks();
                // set all new links
                for (const [ref, title] of newLinks) {
                    fi.setLink(ref, title);
                }
                this.manager.updateProjectsForIndex(fi);
            }
        }
    }

    update() {
        this.lastUpdate = Date.now();
    }

    newFile(name: string, path: string) {
        // console.log("newFile(%d)", this.files.length);
        let file = new WSFile(name, path);
        this.files.push(file);
        this.fileMap.set(path, file);
        // console.log("newFile(%d):", this.files.length, file);
        this.update();
        return file;
    }

    getWords(path: string): number {
        let fi = this.fileMap.get(path);
        if (fi === null || fi === undefined) {
            console.log(`WSDataCollector.getWords(${path}) = ${fi}`);
            return undefined;
        }
        // console.log("GetWords(%s) = %s", path, fi.getWords());
        return fi.words;
    }

    getFile(path: string): WSFile {
        let fi: WSFile;
        if (this.fileMap.has(path)) {
            fi = this.fileMap.get(path);
        } else {
            return null;
        }
        return fi;
    }

    getFileSafer(path: string): WSFile {
        if (this.fileMap.has(path)) {
            return this.fileMap.get(path);
        }
        let af = this.vault.getAbstractFileByPath(path);
        if (af != null && af instanceof TFile) {
            return this.newFile(af.name, af.path);
        }
        return null;
    }

    async scanVault() {
        // console.log("Vault scan initiated.");
        const files = this.vault.getMarkdownFiles();
        // console.log("Vault file list retrieved.");
        for (const i in files) {
            const file = files[i];
            // console.log(`[${Date.now()}: Processing file '${file.path}'.`);
            let fi = this.getFile(file.path);
            if (fi === null) {
                fi = this.newFile(file.basename, file.path);
            }
            this.updateFile(file);
            // console.log(fi.getPath());
            // console.log(fi.getLinks());
            // console.log(fi.getBacklinks());
            let words = WordCountForText(await this.vault.cachedRead(file));
            this.logWords(fi.path, words);

            //console.log(frontMatter.wordStatsProject);
            this.update();
        }
    }
}  