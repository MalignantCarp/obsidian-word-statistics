import { Vault, MetadataCache, TFile, TAbstractFile, getLinkpath, CachedMetadata, FrontMatterCache } from 'obsidian';
import { WSFile } from './files';
import WordStatisticsPlugin from './main';
import { WSProjectManager } from './projects';
import { WordCountForText } from './words';

enum QIType {
    Log = "QIT_LOG",
    Delta = "QIT_DELTA"
}

interface LongformDraft {
    name: string;
    folder: string;
    scenes: string[];
}

class QueuedItem {
    private type: QIType;
    private id: number;
    private path: string;
    private count: number;

    constructor(type: QIType, id: number, path: string, count: number) {
        this.type = type;
        this.id = id;
        this.path = path;
        this.count = count;
    }

    getType() {
        return this.type;
    }

    getID() {
        return this.id;
    }

    getPath() {
        return this.path;
    }

    getCount() {
        return this.count;
    }
}

class Dispatcher {
    private callbacks: Map<string, Function>;

    constructor() {
        this.callbacks = new Map<string, Function>();
    }

    addCallback(id: string, func: Function) {
        if (!this.callbacks.has(id)) {
            this.callbacks.set(id, func);
        }
    }

    removeCallback(id: string) {
        if (this.callbacks.has(id)) {
            this.callbacks.delete(id);
        }
    }

    dispatchMessage(msg: string) {
        this.callbacks.forEach((func, id) => {
            console.log(`Dispatching message '${msg}' for id ${id}`);
            func(id, msg);
        });
    }
}

export class WSDataCollector {
    plugin: WordStatisticsPlugin;
    vault: Vault;
    mdCache: MetadataCache;
    private fileMap: Map<string, WSFile>;
    private fileCallbacks: Map<string, Dispatcher>;
    private files: WSFile[];
    manager: WSProjectManager;
    totalWords: number = 0;
    lastUpdate: number = 0;

    constructor(plugin: WordStatisticsPlugin, vault: Vault, metadataCache: MetadataCache) {
        this.plugin = plugin;
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFile>();
        this.fileCallbacks = new Map<string, Dispatcher>();
        this.files = [];
        this.totalWords = 0;
        this.lastUpdate = 0;
        this.manager = new WSProjectManager(plugin, this);
    }

    addCallback(path: string, id: string, func: Function) {
        if (this.fileCallbacks.has(path)) {
            let disp = this.fileCallbacks.get(path);
            disp.addCallback(id, func);
        } else {
            let disp = new Dispatcher();
            disp.addCallback(id, func);
            this.fileCallbacks.set(path, disp);
        }
    }

    removeCallback(path: string, id: string) {
        if (this.fileCallbacks.has(path)) {
            this.fileCallbacks.get(path).removeCallback(id);
        }
    }

    renameDispatcher(oldPath: string, newPath: string) {
        if (this.fileCallbacks.has(oldPath)) {
            if (this.fileCallbacks.has(newPath)) {
                if (this.fileCallbacks.get(oldPath) != this.fileCallbacks.get(newPath)) {
                    console.log(this.fileCallbacks.get(oldPath));
                    console.log(this.fileCallbacks.get(newPath));
                    throw (Error("Attempted to rename message dispatcher, but a different message dispatcher with that name already exists."));
                }
            }
            this.fileCallbacks.set(newPath, this.fileCallbacks.get(oldPath));
            this.fileCallbacks.delete(oldPath);
        }
    }

    dispatchMessage(path: string, msg: string) {
        if (this.fileCallbacks.has(path)) {
            console.log(`Dispatching '${msg}' for '${path}.`);
            this.fileCallbacks.get(path).dispatchMessage(msg);
        }
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
        if (this.fileMap.has(oldPath)) {
            let fi = this.fileMap.get(oldPath);
            this.fileMap.delete(oldPath);
            if (this.fileMap.has(file.path)) {
                console.log("!!! onRename('%s' to '%s'): New file path already exists!", oldPath, file.path);
                throw Error("Cannot rename file reference as new file path already in use.");
            }
            this.fileMap.set(file.path, fi);
            fi.name = file.name;
            fi.path = file.path;
            this.renameDispatcher(oldPath, file.path);
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

    LogWords(path: string, count: number) {
        if (this.fileMap.has(path)) {
            this.fileMap.get(path).setWords(count);
            return;
        }
        console.log(`Attempted to log words for path '${path}' but path not found in file map.`);
    }

    UpdateFile(file: TFile) {
        // console.log("UpdateFile(%s)", file.path);
        let fi = this.getFile(file.path);
        fi.setTitle(file.name);
        let cache = this.mdCache.getCache(file.path);
        if (cache != undefined && cache != null) {
            fi.setTitle(cache.frontmatter?.['title'] || file.name);
            // this.checkFMLongform(file, cache.frontmatter);
            let tagCache = cache.tags;
            let tags: string[] = [];
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
            oldTags.forEach((tag) => {
                this.manager.updateProjectsForTag(tag)
            })
            newTags.forEach((tag) => {
                this.manager.updateProjectsForTag(tag)
            })
            // Now we need to alert any projects that use a tag that was changed (added/deleted)
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
                        newLinks.push([lFile, link.displayText || lFile.title]);
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

    GetWords(path: string): number {
        let fi = this.fileMap.get(path);
        if (fi === null) {
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
        if (af != null) {
            return this.newFile(af.name, af.path);
        }
        return null;
    }

    async ScanVault() {
        const files = this.vault.getMarkdownFiles();
        for (const i in files) {
            const file = files[i];
            let fi = this.getFile(file.path);
            if (fi === null) {
                fi = this.newFile(file.name, file.path);
            }
            this.UpdateFile(file);
            // console.log(fi.getPath());
            // console.log(fi.getLinks());
            // console.log(fi.getBacklinks());
            let words = WordCountForText(await this.vault.cachedRead(file));
            fi.setWords(words);
            this.totalWords += words;

            //console.log(frontMatter.wordStatsProject);
            this.update();
        }
    }
}  