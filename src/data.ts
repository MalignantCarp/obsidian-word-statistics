import { Vault, MetadataCache, TFile, TAbstractFile, getLinkpath, CachedMetadata, FrontMatterCache } from 'obsidian';
import { WSFile } from './files';
import WordStatisticsPlugin from './main';
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
            console.log(`Dispatching message '${msg}' for id ${id}`)
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
    private queue: QueuedItem[];
    totalWords: number = 0;
    lastUpdate: number = 0;

    constructor(plugin: WordStatisticsPlugin, vault: Vault, metadataCache: MetadataCache) {
        this.plugin = plugin;
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFile>();
        this.fileCallbacks = new Map<string, Dispatcher>();
        this.files = [];
        this.queue = [];
        this.totalWords = 0;
        this.lastUpdate = 0;
    }

    addCallback(filename: string, id: string, func: Function) {
        if (this.fileCallbacks.has(filename)) {
            let disp = this.fileCallbacks.get(filename);
            disp.addCallback(id, func);
        } else {
            let disp = new Dispatcher();
            disp.addCallback(id, func);
            this.fileCallbacks.set(filename, disp);
        }
    }

    removeCallback(filename: string, id: string) {
        if (this.fileCallbacks.has(filename)) {
            this.fileCallbacks.get(filename).removeCallback(id);
        }
    }

    renameDispatcher(filename: string, newFn: string) {
        if (this.fileCallbacks.has(filename)) {
            if (this.fileCallbacks.has(newFn)) {
                if (this.fileCallbacks.get(filename) != this.fileCallbacks.get(newFn)) {
                    console.log(this.fileCallbacks.get(filename))
                    console.log(this.fileCallbacks.get(newFn));
                    throw(Error("Attempted to rename message dispatcher, but a different message dispatcher with that name already exists."))
                }
            }
            this.fileCallbacks.set(newFn, this.fileCallbacks.get(filename));
            this.fileCallbacks.delete(filename);
        }
    }

    dispatchMessage(filename: string, msg: string) {
        if (this.fileCallbacks.has(filename)) {
            console.log(`Dispatching '${msg}' for '${filename}.`)
            this.fileCallbacks.get(filename).dispatchMessage(msg);
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

    onRename(file: TAbstractFile, oldName: string) {
        if (this.fileMap.has(oldName)) {
            let fi = this.fileMap.get(oldName);
            this.fileMap.delete(oldName);
            if (this.fileMap.has(file.path)) {
                console.log("!!! onRename('%s' to '%s'): New file path already exists!", oldName, file.path);
                throw Error("Cannot rename file reference as new file path already in use.");
            }
            this.fileMap.set(file.path, fi);
            fi.name = file.name;
            fi.path = file.path;
            this.renameDispatcher(oldName, file.name);
        } else {
            console.log("!!! onRename('%s' to '%s'): Old file does not exist!", oldName, file.path);
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

    UpdateFile(file: TFile) {
        // console.log("UpdateFile(%s)", file.path);
        let fi = this.getFile(file.path);
        fi.setTitle(file.name);
        let cache = this.mdCache.getCache(file.path);
        if (cache != undefined && cache != null) {
            fi.setTitle(cache.frontmatter?.['title'] || file.name);
            this.checkFMLongform(file, cache.frontmatter);
            let tagCache = cache.tags;
            let tags: string[] = [];
            if (tagCache != undefined && tagCache != null && tagCache.length > 0) {
                tagCache.forEach((tag) => {
                    tags.push(tag.tag);
                });
            }
            fi.setTags(tags);
            if (this.projects.isIndexFile(fi)) {
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
                        newLinks.push([lFile, link.displayText || lFile.getTitle()]);
                    }
                }
                // clear old links
                fi.clearLinks();
                // set all new links
                for (const [ref, title] of newLinks) {
                    fi.setLink(ref, title);
                }
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
        // console.log("GetWords(%s) = %s", path, fi.getWords());
        return fi.currentWords || 0;
    }

    /*
        queuePush(item: QueuedItem) {
            // console.log("Pushing queued item.", this.queue, item)
            this.queue.push(item);
        }
    
        async ProcessQueuedItems() {
            let startTime = Date.now();
            let items = 0;
            while (this.queue.length > 0 && Date.now() - startTime < 500) {
                items++;
                let item = this.queue.pop();
                let fi = this.idMap.get(item.getID());
                if (item.getType() == QIType.Log) {
                    let lastWords = fi.getWords();
                    let newWords = item.getCount();
                    fi.setWords(item.getCount());
                    this.LogDelta("", newWords - lastWords);
                } else if (item.getType() == QIType.Delta) {
                    if (item.getID() == -1) {
                        this.totalWords += item.getCount();
                    } else {
                        fi.addWords(item.getCount());
                    }
                }
                this.update();
            }
            if (this.queue.length > 0) {
                console.log("Processed %d queued items. %d items remain...", items, this.queue.length);
            }
        }
    
        LogWords(path: string, words: number) {
            let fi = this.getFile(path);
    
            this.queuePush(new QueuedItem(QIType.Log, fi.getID(), path, words));
        }
    
        LogDelta(path: string, words: number) {
            // This is where, in future revisions, the words added/deleted will be determined.
            // We will also need to hook into cut/paste events in CM6 to create a different
            // field for adding "imported" and "exported" text. Those may need to be
            // handled differently as a type of history queue type system where it can
            // be considered deleted unless it gets pasted back in, in which case it will
            // be exported
            let fi = this.fileMap.get(path);
            let id: number;
            if (path == "") {
                id = -1;
            } else {
                id = fi.getID();
            }
    
            this.queuePush(new QueuedItem(QIType.Delta, id, path, words));
        }
    */

    getFile(path: string): WSFile {
        let fi: WSFile;
        if (this.fileMap.has(path)) {
            fi = this.fileMap.get(path);
        } else {
            return null;
        }
        return fi;
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