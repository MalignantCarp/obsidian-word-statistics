import { Vault, MetadataCache, TFile } from 'obsidian';
import { QIType, QueuedItem, WSFileRef, WSProject } from './types';
import { WordCountForText } from './words';

export class Collector {
    private vault: Vault;
    private mdCache: MetadataCache;
    private fileMap: Map<string, WSFileRef>;
    private idMap: Map<number, WSFileRef>;
    private files: WSFileRef[];
    private queue: QueuedItem[];
    private totalWords: number = 0;
    private lastUpdate: number = 0;
    private projects: Map<string, WSProject>;
    private projectMap: Map<string, WSProject[]>;

    constructor(vault: Vault, metadataCache: MetadataCache) {
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFileRef>();
        this.idMap = new Map<number, WSFileRef>();
        this.files = [];
        this.queue = [];
        this.projects = new Map<string, WSProject>();
        this.projectMap = new Map<string, WSProject[]>();
        this.totalWords = 0;
        this.lastUpdate = 0;
    }

    getLastUpdate() {
        return this.lastUpdate;
    }

    getTotalFileCount() {
        return this.vault.getMarkdownFiles().length;
    }

    getProject(name: string) {
        if (this.projects.has(name)) {
            return (this.projects.get(name));
        }
        let project = new WSProject(name);
        this.projects.set(name, project);
        return project;
    }

    getProjectsFromPath(path: string) {
        if (this.projectMap.has(path)) {
            return this.projectMap.get(path);
        }
        let frontmatter = this.mdCache.getCache(path).frontmatter;
        /*
        
        TODO: We need a means of building up the projectMap so we can quickly lookup a project for a given
        path. We can technically have multiple projects per path in the event multiple project index files
        contain a link to it, so we will need to keep a list of projects for each path, so the map is for an
        array.
        
        */
        // console.log(frontmatter);
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

    UpdateFile(file: TFile) {
        let fi = this.getFile(file.path);
        let frontMatter = this.mdCache.getCache(file.path).frontmatter;
        let links = this.mdCache.getCache(file.path).links;
        if (frontMatter != undefined) {
            let project = frontMatter['word-stats-project'];
            let isIndex = frontMatter['word-stats-project-is-index'];
            let exclude = frontMatter['word-stats-project-exclude'];
            let title = frontMatter['title'];
            if (title != undefined) {
                fi.setTitle(title);
            }
            if (project != undefined) {
                fi.setProjectName(project);
                if (isIndex != undefined) {
                    // check to see if project is currently an index; if so, will need to check to see if the linked files
                    // are still to be included; iterate over all current files in the project map?
                    fi.setProjectIndex(isIndex);
                }
                if (exclude != undefined) {
                    fi.setProjectExclusion(exclude);
                }
            }
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
        while (this.queue.length > 0 && Date.now() - startTime < 1000) {
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
        return items;
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

    async ScanVault() {
        const files = this.vault.getMarkdownFiles();
        for (const i in files) {
            const file = files[i];
            let fi = this.getFile(file.path);
            this.UpdateFile(file);
            let words = WordCountForText(await this.vault.cachedRead(file));
            fi.setWords(words);
            this.totalWords += words;

            //console.log(frontMatter.wordStatsProject);
            this.update();
        }
    }
}  