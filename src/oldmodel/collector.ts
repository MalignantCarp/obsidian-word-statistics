import { Vault, MetadataCache, TFile, TAbstractFile, parseFrontMatterTags, parseFrontMatterEntry, TFolder } from 'obsidian';
import { WSFile } from './file';
import type WordStatisticsPlugin from '../main';
import { WSProjectManager } from './manager';
import { WordCountForText } from '../words';
import { WSEvents, WSFileEvent } from './event';
import type { WSFileProject } from './project';
import { Statistics, WSStatisticsManager } from './statistics';

export class WSDataCollector {
    plugin: WordStatisticsPlugin;
    vault: Vault;
    mdCache: MetadataCache;
    private fileMap: Map<string, WSFile>;
    private files: WSFile[];
    stats: WSStatisticsManager;
    manager: WSProjectManager;
    lastUpdate: number = 0;
    //queue: [Function, unknown[]][] = [];
    lastWords: number = 0;

    constructor(plugin: WordStatisticsPlugin, vault: Vault, metadataCache: MetadataCache) {
        this.plugin = plugin;
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFile>();
        this.files = [];
        this.lastUpdate = 0;
        this.manager = new WSProjectManager(plugin, this);
        this.stats = new WSStatisticsManager(this);
    }

    cleanup() {
        this.files = [];
        this.fileMap.clear();
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
        let paths: string[] = [];
        this.vault.getMarkdownFiles().forEach((file) => {
            paths.push(file.path);
        });
        return paths.sort();
    }

    getAllFolders() {
        let folders = this.plugin.app.vault.getAllLoadedFiles().filter((t) => t instanceof TFolder);
        let paths: string[] = [];
        folders.forEach((folder) => {
            paths.push(folder.path);
        });
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

    getFilesForFolder(folder: string) {
        let files = this.fileList;
        if (folder !== "" && folder !== "/") {
            files = files.filter(file => file.path.startsWith(folder + "/"));
        }
        return files;
    }

    getWordCountForFolder(folder: string): number {
        let files = this.getFilesForFolder(folder);
        let count = 0;
        files.forEach((file) => {
            count += file.totalWords;
        });
        return count;
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
            this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.Renamed, file: fi }, { filter: fi }));
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
            this.manager.updateProjectsForFile(fi);
            if (this.manager.isIndexFile(fi)) {
                // this is used as an index to a project, so we need to set that project index to null
                let projects = this.manager.getProjectsByFile(fi) as WSFileProject[];
                projects.forEach((proj) => {
                    proj.file = null;
                    this.manager.updateProject(proj);
                });
            }
            this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.Deleted, file: fi }, { filter: fi }));
        } else {
            console.log("!!! onDelete('%s'): File does not exist. Nothing to delete.", file.path);
        }
    }

    onCreate(file: TAbstractFile) {
        if (!this.fileMap.has(file.path) && file instanceof TFile) {
            this.newFile(file.basename, file.path);
        }
    }

    logWords(path: string, newCount: number, load: boolean = false) {
        if (this.fileMap.has(path)) {
            let file = this.fileMap.get(path);
            let oldCount = file.words;
            this.update();
            if (oldCount != newCount) {
                this.lastWords += newCount - oldCount;
                file.words = newCount;
                this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.WordsChanged, file }, { filter: file }));
                if (Statistics.RecordStatsFor(file, this.manager)) {
                    this.stats.onWordCountUpdate(this.lastUpdate, file, oldCount, newCount);
                }
            } else {
                if (Statistics.RecordStatsFor(file, this.manager)) {
                    this.stats.onSilentUpdate(this.lastUpdate, file, oldCount, newCount);
                }
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

    // async executeDeferredItems() {
    //     while (this.queue.length > 0) {
    //         let [func, pack] = this.queue.shift();
    //         func(...pack);
    //     };
    // }

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
            fi.setTitle(parseFrontMatterEntry(cache.frontmatter, "title") || file.basename);
            let wordGoal = parseInt(parseFrontMatterEntry(cache.frontmatter, "word-goal"));
            if (wordGoal != null && !isNaN(+wordGoal)) {
                fi.wordGoal = wordGoal;
                this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.GoalsSet, file: fi }, { filter: fi }));
            }
            //fi.setTitle(cache.frontmatter?.['title'] || file.basename);
            // this.checkFMLongform(file, cache.frontmatter);
            let tagCache = cache.tags;
            let fmTags = parseFrontMatterTags(cache.frontmatter);
            let oldTags = fi.tags;
            let newTags = new Set<string>();
            if (fmTags != null) {
                fmTags.forEach((item) => {
                    newTags.add(item);
                });
            }
            if (tagCache != undefined && tagCache != null && tagCache.length > 0) {
                tagCache.forEach((tag) => {
                    newTags.add(tag.tag);
                });
            }
            let tagsToDelete: string[] = [];
            let tagsToAdd: string[] = [];
            oldTags.forEach((oldTag) => {
                if (!newTags.has(oldTag)) {
                    tagsToDelete.push(oldTag);
                }
            });
            newTags.forEach((newTag) => {
                if (!oldTags.contains(newTag)) {
                    tagsToAdd.push(newTag);
                }
            });
            fi.setTags(Array.from(newTags));
            // Now we need to alert any projects that use a tag that was changed (added/deleted) to update
            tagsToDelete.forEach((tag) => {
                this.manager.updateProjectsForTag(tag);
            });
            tagsToAdd.forEach((tag) => {
                this.manager.updateProjectsForTag(tag);
            });
            if (this.manager.isIndexFile(fi)) {
                // update index
                let links = this.mdCache.getCache(file.path).links;
                let newLinks: [WSFile, string][] = [];
                if (links) {
                    for (let i = 0; i < links.length; i++) {
                        let link = links[i];
                        // let linkPath = getLinkpath(link.link);
                        let linkedFile = this.mdCache.getFirstLinkpathDest(link.link, file.path);
                        // if there is no link, we don't want to add it to the list
                        if (linkedFile != null) {
                            let lFile = this.getFileSafer(linkedFile.path);
                            let dText = link.link != link.displayText ? link.displayText : null;
                            newLinks.push([lFile, dText || lFile.title]);
                        }
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

    pushFile(file: WSFile) {
        // console.log(`File ${file.path} being pushed to storage list and map.`);
        this.files.push(file);
        this.fileMap.set(file.path, file);
    }

    newFile(name: string, path: string) {
        // console.log("newFile(%d)", this.files.length);
        let file = new WSFile(name, path);
        this.pushFile(file);
        // console.log("newFile(%d):", this.files.length, file);
        this.update();
        return file;
    }

    setFile(path: string, file: WSFile) {
        // console.log(`setFile(${path})`);
        if (!this.files.contains(file) && !this.fileMap.has(path)) {
            this.pushFile(file);
        } else {
            console.log(`For file '${file.path}:`);
            console.log(`fileInList? ${this.files.contains(file)}, fileInMap? ${this.fileMap.has(path)}`);
            console.log(`Attempted to set file for path ${path}, but it is already set.`);
        }
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
            console.log(`Attempted to get file ${path}, but it did not exist. Creating...`);
            return this.newFile(af.basename, af.path);
        }
        return null;
    }

    async scanVault(fileLog: WSFile[] = []) {
        // console.log(`Vault scan initiated (${this.fileList.length}).`);
        const files = this.vault.getMarkdownFiles();
        // console.log("Vault file list retrieved.");
        let loadedFiles = new Map<string, WSFile>(fileLog.map((value) => { return [value.path, value]; }));
        // console.log("Mapped existing files.");
        for (let file of files) {
            let fi: WSFile;
            // console.log(`@${Date.now()}: Processing file '${file.path}'.`);
            // if (fileLog.length > 0) console.log(`isInLoadedFiles? ${loadedFiles.has(file.path)}, isInFileMap? ${this.fileMap.has(file.path)}`);
            if (loadedFiles.has(file.path)) {
                fi = loadedFiles.get(file.path);
                loadedFiles.delete(file.path);
                this.setFile(file.path, fi);
                this.lastWords += fi.totalWords;
                if (fi.totalWords > 0) {
                    this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.WordsChanged, file: fi }, { filter: fi }));
                }
            } else {
                fi = this.getFile(file.path);
                if (fi === null) {
                    fi = this.newFile(file.basename, file.path);
                }
            }
            this.updateFile(file);
            // console.log(fi.getPath());
            // console.log(fi.getLinks());
            // console.log(fi.getBacklinks());
            let words = WordCountForText(await this.vault.cachedRead(file));
            fi.setStartWords(words);
            this.logWords(fi.path, words, true);

            //console.log(frontMatter.wordStatsProject);
            this.update();
        }
        if (loadedFiles.size > 0) {
            console.log("Failed to load the following files. Do they still exist in the file system?");
            console.log(loadedFiles);
        }
    }
}  