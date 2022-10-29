import { type Vault, type MetadataCache, TFile, TAbstractFile, TFolder, parseFrontMatterEntry } from 'obsidian';
import { WSFile } from './file';
import type WordStatisticsPlugin from '../main';
import { GOAL, RECORDING, WSFolder } from './folder';
import { WordCountForText } from 'src/words';
import { WordStatsManager } from './stats';
import { WSDataEvent, WSEvent, WSEvents } from './events';
import { FormatWords } from 'src/util';

export class WSFileManager {
    public loaded: boolean = false;

    constructor(
        public plugin: WordStatisticsPlugin,
        public vault: Vault,
        public cache: MetadataCache,
        public root: WSFolder,
        public stats: WordStatsManager = new WordStatsManager(plugin),
        public folderMap: Map<string, WSFolder> = new Map<string, WSFolder>(),
        public fileMap: Map<string, WSFile> = new Map<string, WSFile>()
    ) { }

    triggerFileUpdate(file: WSFile) {
        this.plugin.events.trigger(new WSDataEvent({ type: WSEvents.Data.File }, { filter: file }));
    }

    triggerFolderUpdate(folder: WSFolder) {
        this.plugin.events.trigger(new WSDataEvent({ type: WSEvents.Data.Folder }, { filter: folder }));
    }

    cleanup() {
        this.fileMap.clear();
        this.folderMap.clear();
        this.root?.clear();
    }

    updateCache() {
        this.cache = this.plugin.app.metadataCache;
    }

    updateGoals(folder: WSFolder, wordGoal: number, wordGoalForFiles: number, wordGoalForFolders: number) {
        let triggers: [GOAL, number][] = [];
        if (wordGoal != folder.wordGoal) {
            folder.wordGoal = wordGoal;
            triggers.push([GOAL.SELF, wordGoal]);
        }
        if (wordGoalForFiles != folder.wordGoalForFiles) {
            folder.wordGoalForFiles = wordGoalForFiles;
            triggers.push([GOAL.FILES, wordGoalForFiles]);
        }
        if (wordGoalForFolders != folder.wordGoalForFolders) {
            folder.wordGoalForFolders = wordGoalForFolders;
            triggers.push([GOAL.FOLDERS, wordGoalForFolders]);
        }
        if (triggers.length > 0) {
            folder.triggerGoalSet(triggers);
            this.triggerFolderUpdate(folder);
        }
    }

    mapToFolder(folder: TFolder): WSFolder {
        // console.log(`mapToFolder(${folder.path})`);
        if (folder instanceof TFolder && folder === this.vault.getRoot()) {
            // console.log("Folder is root.")
            return this.root;
        }
        if (folder instanceof TFolder && this.folderMap.has(folder.path)) return this.folderMap.get(folder.path) as WSFolder;
        // console.log("Folder is not mapped. Mapping to parent folder.");
        let parent = this.mapToFolder(folder.parent);
        let mappedFolder = new WSFolder(this.plugin, parent, folder.path, folder.name);
        // console.log(`Mapped folder ${folder.path} --> ${parent.path} --> ${mappedFolder.path}`);
        return mappedFolder;
    }

    getFile(file: TFile): WSFile {
        return this.fileMap.get(file.path);
    }

    newFile(file: TFile): WSFile {
        let parent = this.mapToFolder(file.parent);
        let newFile = new WSFile(this.plugin, parent, file.path, file.name, file.basename);
        this.fileMap.set(file.path, newFile);
        newFile.triggerCreated();
        return newFile;
    }

    onRename(file: TAbstractFile, oldPath: string) {
        // console.log(`WSFileManager.onRename(${file.path}, ${oldPath}): ${this.fileMap.has(file.path)}/${this.folderMap.has(file.path)}, ${this.fileMap.has(oldPath)}/${this.folderMap.has(oldPath)}`);
        if (file instanceof TFile) {
            if (this.fileMap.has(file.path)) {
                console.log("!!! onRename('%s' to '%s'): New file path already exists!", oldPath, file.path);
                throw Error("Cannot rename file reference as new file path already in use.");
            }
            if (this.fileMap.has(oldPath)) {
                let fi = this.fileMap.get(oldPath);
                this.fileMap.delete(oldPath);
                this.fileMap.set(file.path, fi);
                let oldName = fi.name;
                fi.name = file.name;
                fi.basename = file.basename;
                fi.path = file.path;
                let parent = this.mapToFolder(file.parent);
                parent.moveChildFrom(fi);
                fi.triggerRenamed(oldName, fi.name);
                this.triggerFileUpdate(fi);
            } else {
                console.log("!!! onRename('%s' to '%s'): Old file does not exist!", oldPath, file.path);
            }
        } else if (file instanceof TFolder) {
            if (this.folderMap.has(file.path)) {
                console.log("!!! onRename('%s' to '%s'): New folder path already exists!", oldPath, file.path);
                throw Error("Cannot rename folder reference as new folder path already in use.");
            }
            if (this.folderMap.has(oldPath)) {
                let fo = this.folderMap.get(oldPath);
                this.folderMap.delete(oldPath);
                this.folderMap.set(file.path, fo);
                let oldName = fo.name;
                fo.name = file.name;
                fo.path = file.path;
                let parent = this.mapToFolder(file);
                parent.moveFolderFrom(fo);
                fo.triggerRenamed(oldName, fo.name);
                this.triggerFolderUpdate(fo);
            } else {
                console.log("!!! onRename('%s' to '%s'): Old folder does not exist!", oldPath, file.path);
            }
        }
    }

    onDelete(file: TAbstractFile) {
        console.log("onDelete(", file.path, ")");
        if (file instanceof TFile) {
            if (this.fileMap.has(file.path)) {
                let fi = this.fileMap.get(file.path);
                this.fileMap.delete(file.path);
                fi.parent.deleteChild(fi);
                this.triggerFileUpdate(fi);
            } else {
                console.log("!!! onDelete('%s'): File does not exist. Nothing to delete.", file.path);
            }
        } else if (file instanceof TFolder) {
            if (this.folderMap.has(file.path)) {
                let fo = this.folderMap.get(file.path);
                this.folderMap.delete(file.path);
                fo.parent.deleteChildFolder(fo);
                this.triggerFolderUpdate(fo);
            } else {
                console.log("!!! onDelete('%s'): Folder does not exist. Nothing to delete.", file.path);
            }
        }
        // console.log(file);
    }

    onCreate(file: TAbstractFile) {
        if (file instanceof TFile) {
            if (!this.fileMap.has(file.path)) {
                let fi = this.newFile(file);
                this.triggerFileUpdate(fi);
            }
        } else if (file instanceof TFolder) {
            if (!this.folderMap.has(file.path)) {
                let parent = this.mapToFolder(file);
                let fo = this.newFolder(parent, file);
                this.triggerFolderUpdate(fo);
            }
        }
    }

    newFolder(parent: WSFolder, folder: TFolder): WSFolder {
        let newFolder = new WSFolder(this.plugin, parent, folder.path, folder.name, folder.name);
        this.folderMap.set(folder.path, newFolder);
        newFolder.triggerCreated();
        return newFolder;
    }

    updateFileMetadata(file: TFile) {
        // console.log("updateFileMetadata");
        // console.log(file.path, this.fileMap.get(file.path));
        //console.log(this.fileMap);
        let fileRef = this.fileMap.get(file.path);
        let cache = this.cache.getCache(file.path);
        let title = parseFrontMatterEntry(cache?.frontmatter, "title") || undefined;
        let goal = parseFrontMatterEntry(cache?.frontmatter, "word-goal") as number || undefined;
        if (title === undefined) {
            if (fileRef.title !== "") {
                fileRef.title = "";
                fileRef.triggerTitleSet("");
            }
        } else {
            if (fileRef.title != title) {
                fileRef.title = title;
                fileRef.triggerTitleSet(title);
            }
        }
        // console.log(goal);
        if (goal === undefined) {
            if (fileRef.wordGoal !== 0) {
                fileRef.wordGoal = 0;
                fileRef.triggerGoalSet(0);
            }
        } else {
            if (fileRef.wordGoal != goal) {
                fileRef.wordGoal = goal;
                fileRef.triggerGoalSet(goal);
            }
        }
        this.triggerFileUpdate(fileRef);
    }

    setMonitoringForFolder(folder: WSFolder, state: RECORDING) {
        folder.recording = state;
        folder.triggerRecordingSet(state, true);
    }

    async updateFileWordCountOffline(file: TFile) {
        // this is an offline change, such as one done when first reading in the file on load
        // first, we don't do anything if we can't resolve this file
        let fileRef = this.getFile(file);
        // console.log(`updateFileWordCountOffline(${file.path}) = ${fr instanceof WSFile}`)
        if (!(fileRef instanceof WSFile)) return null;
        let startTime = Date.now();
        let newCount = WordCountForText(await this.vault.cachedRead(file));
        let endTime = Date.now();
        this.plugin.logSpeed(newCount, startTime, endTime);
        let oldCount = fileRef.wordCount;
        // do nothing else if the counts are unchanged
        if (newCount === oldCount) return null;
        // if there are offline changes, import/export text will show up
        let updateTime = Date.now();
        fileRef.updateStats(updateTime, oldCount, newCount);
        fileRef.wordCount = newCount;
        fileRef.propagateWordCountChange(oldCount, newCount);
        this.plugin.lastFile = fileRef;
        if (fileRef.parent.isRecording && fileRef.stats.length > 0) this.stats.extendStats([fileRef.last]);
        return fileRef;
    }

    async updateFileWordCountOnline(file: TFile, newText: string) {
        // this is a live change; somebody is either typing or just loaded this file
        let fileRef = this.getFile(file);
        if (!(fileRef instanceof WSFile)) return null;
        let startTime = Date.now();
        let newCount = WordCountForText(newText);
        let endTime = Date.now();
        this.plugin.logSpeed(newCount, startTime, endTime);
        let oldCount = fileRef.wordCount;
        let updateTime = Date.now();
        fileRef.updateStats(updateTime, oldCount, newCount);
        fileRef.wordCount = newCount;
        if (oldCount === newCount) {
            // if the word count hasn't changed, the stats info has so send an update for the UI to update stats as may be applicable
            fileRef.triggerWordsChanged(oldCount, newCount, updateTime);
        } else {
            // if the word count has changed, propagate that change up the tree and trigger stats event to propagate up the tree as well
            fileRef.propagateWordCountChange(oldCount, newCount);
            fileRef.triggerWordsChanged(oldCount, newCount, updateTime, true);
        }
        this.plugin.lastFile = fileRef;
        if (fileRef.parent.isRecording && fileRef.stats.length > 0) this.stats.extendStats([fileRef.last]);
        return fileRef;
    }

    getFileSafe(file: TFile): WSFile {
        if (this.fileMap.has(file.path)) return this.fileMap.get(file.path);
        return this.newFile(file);
    }

    buildTreeChildrenAbstract(parent: WSFolder, children: TAbstractFile[]) {
        for (let child of children) {
            if (child instanceof TFile && child.extension === "md") {
                // console.log("Building file for path: ", child.path);
                if (!this.fileMap.has(child.path)) {
                    this.newFile(child);
                    continue;
                }
            } else if (child instanceof TFolder) {
                // console.log("Building folder for path: ", child.path);
                let newParent: WSFolder = this.folderMap.get(child.path) || this.newFolder(parent, child);;
                this.buildTreeChildrenAbstract(newParent, child.children);
                continue;
            }
        }
    }

    async buildTree() {
        let startTime = Date.now();
        if (this.root instanceof WSFolder) return;
        // console.log("Obtaining root TFolder");
        let rootT = this.vault.getRoot();
        let root = new WSFolder(this.plugin, null, rootT.path, rootT.name, rootT.name);
        this.root = root;
        // console.log("Converted to WSFolder");
        let children = rootT.children;
        // console.log("Building children");
        this.buildTreeChildrenAbstract(root, children);
        let endTime = Date.now();
        console.log(`Built ${this.folderMap.size} folder(s) and ${this.fileMap.size} file(s) in ${endTime - startTime}ms.`);
        await this.syncStats();
        await this.countAll();
    }

    async countAll() {
        // console.log(`countAll()`);
        let startTime = Date.now();
        const files = this.vault.getMarkdownFiles();
        // console.log(files);
        // console.log(this.fileMap);
        // console.log(this.root);
        for (let file of files) {
            this.updateFileMetadata(file);
            let fileRef = await this.updateFileWordCountOffline(file);
            //console.log(fileRef?.path, fileRef?.wordCount)
        }
        let endTime = Date.now();
        console.log(`Counted all ${files.length} file(s) in ${endTime - startTime}ms. ${FormatWords(this.root.wordCount)} counted.`);
    }

    async updateTree() {
        // console.log("updateTree()");
        let startTime = Date.now();
        let files = this.fileMap.size;
        let folders = this.folderMap.size;
        let folder = this.vault.getRoot();
        this.root.path = folder.path;
        this.root.name = folder.name;
        this.buildTreeChildrenAbstract(this.root, folder.children);
        let endTime = Date.now();
        console.log(`Updated tree in ${endTime - startTime}ms. Added ${this.folderMap.size - folders} folder(s) and ${this.fileMap.size - files} file(s).`);
    }

    async loadTree(root: WSFolder, folderMap: Map<string, WSFolder>, fileMap: Map<string, WSFile>) {
        if (this.loaded) return;
        this.root = root;
        this.folderMap = folderMap;
        this.fileMap = fileMap;
        this.loaded = true;
        await this.updateTree();
        await this.syncStats();
        await this.countAll();
    }

    async syncStats() {
        let startTime = Date.now();
        for (let file of this.fileMap.values()) {
            // console.log(">>", file?.path, file?.stats);
            this.stats.extendStats(file.stats);
        }
        let endTime = Date.now();
        console.log(`Synchronized stats for ${this.fileMap.size} file(s) in ${endTime - startTime}ms.`);
    }
}
