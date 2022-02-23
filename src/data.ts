import { Vault, MetadataCache, TFile } from 'obsidian';
import { QIType, QueuedItem, WCFileRef } from './types';
import { WordCountForText } from './words';

export class Collector {
    private vault: Vault;
    private mdCache: MetadataCache;
    private fileMap: Map<string, WCFileRef>;
    private idMap: Map<number, WCFileRef>;
    private files: WCFileRef[];
    private queue: QueuedItem[];
    private totalWords: number = 0;
    private lastUpdate: number = 0;

    constructor(vault: Vault, metadataCache: MetadataCache) {
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WCFileRef>();
        this.idMap = new Map<number, WCFileRef>();
        this.files = [];
        this.queue = [];
        this.totalWords = 0;
        this.lastUpdate = 0;
    }

    getLastUpdate() {
        return this.lastUpdate;
    }

    getTotalFileCount() {
        return this.vault.getMarkdownFiles().length;
    }

    onRename(file: TFile, oldName: string) {
        // this returns undefined
        let fi = this.fileMap.get(oldName);
        if (!(this.fileMap.has(oldName) || this.fileMap.has(file.path))) {
            fi = this.newFile(file.path);
        }
        fi.setPath(file.path);
        this.fileMap.delete(oldName);
        this.fileMap.set(file.path, fi);
        this.update();
    }

    update() {
        this.lastUpdate = Date.now();
    }

    newFile(path: string) {
        console.log("newFile(%d)", this.files.length);
        let file = new WCFileRef(this.files.length, path);
        this.files.push(file);
        this.fileMap.set(path, file);
        this.idMap.set(file.getID(), file);
        console.log("newFile(%d):", this.files.length, file);
        this.update();
        return file;
    }

    queuePush(item: QueuedItem) {
        console.log("Pushing queued item.", this.queue, item)
        this.queue.push(item);
    }

    getTotalWords(): number {
        return this.totalWords;
    }

    async ProcessQueuedItems() {
        let startTime = Date.now();
        let items = 0;
        while (this.queue.length > 0 && Date.now() - startTime < 1000) {
            items ++;
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
        return items;
    }

    GetWords(path: string): number {
        let fi = this.fileMap.get(path);
        console.log("GetWords(%s) = %s", path, fi.getWords());
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

    getFile(path: string): WCFileRef {
        let fi: WCFileRef;
        if (this.fileMap.has(path)) {
            fi = this.fileMap.get(path);
        } else {
            // this log will always fire on the first time any file is accessed
            // console.log("[!!!] Tried to get file '%s' but it did not exist. Created new file reference.", path);
            fi = this.newFile(path);
        }
        return fi;
    }

    async ScanVault() {
        const files = this.vault.getMarkdownFiles();
        for (const i in files) {
            const file = files[i];
            let fi = this.getFile(file.path);
            let words = WordCountForText(await this.vault.cachedRead(file));
            fi.setWords(words);
            this.totalWords += words;
            this.update();
        }
    }
}  