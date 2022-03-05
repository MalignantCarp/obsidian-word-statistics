import { Vault, MetadataCache, TFile, TAbstractFile } from 'obsidian';
import { WSFileRef } from './files';
import WordStatisticsPlugin from './main';
import { WSProjectManager } from './projects';
import { WordCountForText } from './words';

enum QIType {
	Log = "QIT_LOG",
	Delta = "QIT_DELTA"
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

export class WSDataCollector {
    private plugin: WordStatisticsPlugin;
    private vault: Vault;
    private mdCache: MetadataCache;
    private fileMap: Map<string, WSFileRef>;
    private idMap: Map<number, WSFileRef>;
    private files: WSFileRef[];
    private queue: QueuedItem[];
    private totalWords: number = 0;
    private lastUpdate: number = 0;
    public projects: WSProjectManager;

    constructor(plugin: WordStatisticsPlugin, vault: Vault, metadataCache: MetadataCache) {
        this.plugin = plugin;
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFileRef>();
        this.idMap = new Map<number, WSFileRef>();
        this.files = [];
        this.queue = [];
        this.projects = new WSProjectManager(plugin, this);
        this.totalWords = 0;
        this.lastUpdate = 0;
    }

    getMetadataCache() {
        return this.mdCache;
    }

    getPlugin() {
        return this.plugin
    }

    getPluginSettings() {
        return this.plugin.settings
    }

    getLastUpdate() {
        return this.lastUpdate;
    }

    getTotalFileCount() {
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
            fi.setPath(file.path);
        } else {
            console.log("!!! onRename('%s' to '%s'): Old file does not exist!", oldName, file.path);
            let fi = this.getFile(file.path);
        }
        this.update();
    }

    onDelete(file: TAbstractFile) {
        console.log(file);
        if (this.fileMap.has(file.path)) {
            let fi = this.fileMap.get(file.path);
            this.fileMap.delete(file.path);
            this.idMap.delete(fi.getID());
        } else {
            console.log("!!! onDelete('%s'): File does not exist. Nothing to delete.", file.path);
        }
    }

    UpdateFile(file: TFile) {
        // console.log("UpdateFile(%s)", file.path);
        let fi = this.getFile(file.path);
        let frontMatter = this.mdCache.getCache(file.path).frontmatter;
        if (frontMatter != undefined) {
            // we should do something to update links for a project; if the file is set to be a project index
            // can a project have more than one index?
            let title = frontMatter['title'];
            fi.setTitle(title);
        }
    }

    update() {
        this.lastUpdate = Date.now();
    }

    newFile(path: string) {
        // console.log("newFile(%d)", this.files.length);
        let file = new WSFileRef(this.files.length, path);
        this.files.push(file);
        this.fileMap.set(path, file);
        this.idMap.set(file.getID(), file);
        // console.log("newFile(%d):", this.files.length, file);
        this.update();
        return file;
    }

    queuePush(item: QueuedItem) {
        // console.log("Pushing queued item.", this.queue, item)
        this.queue.push(item);
    }

    getTotalWords(): number {
        return this.totalWords;
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

    GetWords(path: string): number {
        let fi = this.fileMap.get(path);
        // console.log("GetWords(%s) = %s", path, fi.getWords());
        return fi.getWords() || 0;
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

    getFile(path: string): WSFileRef {
        let fi: WSFileRef;
        if (this.fileMap.has(path)) {
            fi = this.fileMap.get(path);
        } else {
            // this log will always fire on the first time any file is accessed
            // console.log("[!!!] Tried to get file '%s' but it did not exist. Created new file reference.", path);
            fi = this.newFile(path);
        }
        return fi;
    }

    getFilebyID(id: number): WSFileRef {
        if (!this.idMap.has(id)) {
            return null;
        }
        return this.idMap.get(id);
    }
    
    async ScanVault() {
        const files = this.vault.getMarkdownFiles();
        for (const i in files) {
            const file = files[i];
            let fi = this.getFile(file.path);
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