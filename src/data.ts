import { Vault, MetadataCache, TFile, TAbstractFile } from 'obsidian';
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
    private projects: Map<string, WSProject>; // projectName, Project object
    private projectMap: Map<number, WSProject[]>; // WSFileRef.id, Project List

    constructor(vault: Vault, metadataCache: MetadataCache) {
        this.vault = vault;
        this.mdCache = metadataCache; // we will eventually use this to obtain content of embeds
        this.fileMap = new Map<string, WSFileRef>();
        this.idMap = new Map<number, WSFileRef>();
        this.files = [];
        this.queue = [];
        this.projects = new Map<string, WSProject>();
        this.projectMap = new Map<number, WSProject[]>();
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
        if (name == undefined || name == null) {
            return null;
        }
        if (this.projects.has(name)) {
            return (this.projects.get(name));
        }
        let project = new WSProject(name);
        this.projects.set(name, project);
        return project;
    }

    getProjectsFromPath(path: string) {
        let ref = this.fileMap.get(path);
        let projects: WSProject[] = [];
        if (ref.hasProject()) {
            projects.push(ref.getProject());
        }
        if (ref.hasBacklinks()) {
            let backlinks = ref.getBacklinkedProjects();
            for (let i = 0; i < backlinks.length; i++) {
                projects.push(backlinks[i]);
            }
        }
        return projects;
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
        let id = fi.getID();
        let frontMatter = this.mdCache.getCache(file.path).frontmatter;
        if (frontMatter != undefined) {
            let project = this.getProject(frontMatter['word-stats-project']);
            let isIndex = frontMatter['word-stats-project-is-index'];
            let exclude = frontMatter['word-stats-project-exclude'];
            let title = frontMatter['title'];
            if (title != undefined) {
                fi.setTitle(title);
            }
            if (project != null) {
                if (fi.getProject() != project) {
                    fi.setProject(project);
                }
                if (isIndex != undefined) {
                    // check to see if project is currently an index; if so, will need to check to see if the linked files
                    // are still to be included; iterate over all current files in the project map?
                    fi.setProjectIndex(isIndex);
                }
                if (exclude != undefined) {
                    fi.setProjectExclusion(exclude);
                }
            }
            if (fi.isProjectIndex) {
                let oldLinks: WSFileRef[] = [];
                oldLinks.push(...fi.getLinks());
                fi.clearLinks(); // clear the old links
                let newLinks: WSFileRef[] = [];
                let links = this.mdCache.getCache(file.path).links;
                if (links != undefined) {
                    for (let i = 0; i < links.length; i++) {
                        let linkName = links[i].link;
                        let dest = this.mdCache.getFirstLinkpathDest(linkName, file.path);
                        newLinks.push(this.getFile(dest.path));
                    }
                }
                for (let i = 0; i < newLinks.length; i++) {
                    let link = newLinks[i];
                    link.setBacklink(id, project);
                    if (oldLinks.contains(link)) {
                        oldLinks.remove(link);
                    }
                    fi.addLink(link);
                }
                for (let i = 0; i < oldLinks.length; i++) {
                    oldLinks[i].removeBacklink(id);
                }
            } else if (fi.hasLinks()) {
                // this is not an index, so does not need links
                let links = fi.getLinks();
                for (let i = 0; i < links.length; i++) {
                    let link = links[i];
                    link.removeBacklink(id);
                }
                fi.clearLinks();
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

    async getProjectWordsTotal(project: WSProject) {
        let refs = project.getFileList();
        let words = 0;
        for (let i = 0; i < refs.length; i++) {
            let fi = refs[i];
            if (!fi.isCountExcludedFromProject()) {
                words += fi.getWords();
            }
            if (fi.hasLinks()) {
                let links = fi.getLinks();
                for (let j = 0; j < links.length; j++) {
                    let link = links[j];
                    if (!link.isCountExcludedFromProject()) {
                        words += link.getWords();
                    }
                }
            }
        }
    }

    getProjectFiles(project: WSProject, ignoreExclusions: boolean) {
        let fileList = project.getFileList();
        let files: WSFileRef[] = [];
        for (let i = 0; i < fileList.length; i++) {
            let fi = fileList[i];
            if (!fi.isCountExcludedFromProject() || ignoreExclusions) {
                files.push(fi);
            }
            if (fi.hasLinks()) {
                let links = fi.getLinks();
                for (let j = 0; j < links.length; j++) {
                    let link = links[j];
                    if (!link.isCountExcludedFromProject() || ignoreExclusions) {
                        files.push(link);
                    }
                }
            }
        }
    }


}  