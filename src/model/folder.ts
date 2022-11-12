import type WordStatisticsPlugin from "src/main";
import { Settings } from "src/settings";
import { WSEvents, WSFolderEvent } from "./events";
import { WSFile } from "./file";
import { StatsPropagate, WordStats } from "./stats";

export enum RECORDING {
    OFF = 0,
    ON = 1,
    INHERIT = 2
}

export enum GOAL {
    SELF = 0,
    FILES = 1,
    FOLDERS = 2
}

export class WSFolder extends StatsPropagate {
    constructor(
        public plugin: WordStatisticsPlugin,
        public parent: WSFolder,
        public path: string,
        public name: string,
        public title: string = "",
        public wordCount: number = 0,
        public wordGoalForFiles: number = 0,
        public wordGoalForFolders: number = 0,
        public wordGoal: number = 0,
        public recording: RECORDING = RECORDING.INHERIT,
        public childFolders: WSFolder[] = [],
        public children: WSFile[] = [],
        public startTime: number = 0,
        public endTime: number = 0,
        public duration: number = 0,
        public startWords: number = 0,
        public endWords: number = 0,
        public wordsAdded: number = 0,
        public wordsDeleted: number = 0,
        public wordsImported: number = 0,
        public wordsExported: number = 0,
        public netWords: number = 0,
        public writingTime: number = 0
    ) {
        super();
        if (parent !== null) {
            // console.log(`Adding WSFolder(${path}) to parent: ${parent.path}`);
            this.parent.addChildFolder(this);
        }
    }

    isEmpty(): boolean {
        if (this.children.length > 0) return false;
        let empty = true;
        for (let folder of this.childFolders) {
            if (!empty) break;
            if (!folder.isEmpty()) empty = false;
        }
        return empty;
    }

    get isRecording(): boolean {
        if (this.plugin.settings.statistics.record === Settings.Statistics.RECORD.ALL) return true;
        if (this.recording === RECORDING.OFF) return false;
        if (this.recording === RECORDING.ON) return true;
        // must be inherited
        if (this.parent instanceof WSFolder) return this.parent.checkRecording();
        return false;
    }

    checkRecording(): boolean {
        if (this.recording === RECORDING.OFF) return false;
        if (this.recording === RECORDING.ON) return true;
        if (this.parent instanceof WSFolder) return this.parent.checkRecording();
        return false;
    }

    getTitle(): string {
        if (this.title != "") return this.title;
        return this.name;
    }

    getAllFiles(): WSFile[] {
        let files: WSFile[];
        for (let folder of this.childFolders) {
            for (let child of folder.getAllFiles()) {
                files.push(child);
            }
        }
        for (let child of this.children) {
            files.push(child);
        }
        return files;
    }

    moveChildHere(child: WSFile) {
        let from = child.parent;
        child.parent = this;
        from?.children.remove(child);
        this.addChild(child);
    }

    addChild(child: WSFile) {
        this.children.push(child);
        this.children.sort((a, b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true }));
    }

    moveFolderHere(childFolder: WSFolder) {
        let from = childFolder.parent;
        childFolder.parent = this;
        from?.childFolders.remove(childFolder);
        this.addChildFolder(childFolder);
    }

    addChildFolder(childFolder: WSFolder) {
        this.childFolders.push(childFolder);
        this.childFolders.sort((a, b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true }));
    }

    clear() {
        for (let child of this.children) {
            child.clear();
        }
        for (let childFolder of this.childFolders) {
            childFolder.clear();
        }
    }

    deleteChild(child: WSFile) {
        this.children.remove(child);
        if (child.parent === this) {
            child.clear();
        }
    }

    deleteChildFolder(childFolder: WSFolder) {
        this.childFolders.remove(childFolder);
        if (childFolder.parent === this) {
            childFolder.clear();
        }
    }

    recalculateStats() {
        let stats = this.plugin.manager.stats.getStatsForFolder(this);
        if (stats.length > 0) {
            this.startTime = WordStats.GetStartTime(stats);
            this.endTime = WordStats.GetEndTime(stats);
            this.duration = WordStats.GetDuration(stats);
            this.startWords = WordStats.GetStartWords(stats);
            this.endWords = WordStats.GetEndWords(stats);
            this.wordsAdded = WordStats.GetWordsAdded(stats);
            this.wordsDeleted = WordStats.GetWordsDeleted(stats);
            this.wordsImported = WordStats.GetWordsImported(stats);
            this.wordsExported = WordStats.GetWordsExported(stats);
            this.netWords = WordStats.GetNetWords(stats);
            this.writingTime = WordStats.GetWritingTime(stats);
        } else {
            this.startTime = 0;
            this.endTime = 0;
            this.duration = 0;
            this.startWords = 0;
            this.endWords = 0;
            this.wordsAdded = 0;
            this.wordsDeleted = 0;
            this.wordsImported = 0;
            this.wordsExported = 0;
            this.netWords = 0;
            this.writingTime = 0;
        }
        if (this.parent?.isRecording) this.parent.recalculateStats();
    }

    getWordGoal() {
        if (this.wordGoal > 0) return this.wordGoal;
        let ancestor = this.parent;
        while (ancestor !== null) {
            if (ancestor.wordGoalForFolders > 0) return ancestor.wordGoalForFolders;
            ancestor = ancestor.parent;
        }
        return 0;
    }

    propagateWordCountChange(oldCount: number, newCount: number) {
        // console.log(`${this.path}.propagateWordCountChange(${this.wordCount} - ${oldCount} + ${newCount} = ${this.wordCount - oldCount + newCount})`)
        this.wordCount = this.wordCount - oldCount + newCount;
        this.parent?.propagateWordCountChange(oldCount, newCount);
    }

    traceLineage(ancestry: string[] = []) {
        ancestry.push(this.name);
        if (this.parent instanceof WSFolder) {
            this.parent.traceLineage(ancestry);
        }
        return ancestry;
    }

    recount() {
        let count = 0;
        this.childFolders.forEach(folder => {
            folder.recount();
            count += folder.wordCount;
        });
        this.children.forEach(file => count += file.wordCount);
        this.wordCount = count;
    }

    triggerRecordingSet(recording: RECORDING, chain: boolean) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.RecordingSet, folder: this, data: [recording]}, {filter: this}));
        if (!chain) return;
        for (let child of this.childFolders) {
            child.triggerRecordingSet(recording, chain);
        }
    }

    triggerWordsChanged(oldCount: number, newCount: number, timestamp: number, chain: boolean = false) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.WordsChanged, folder: this, data: [timestamp, oldCount, newCount] }, { filter: this }));
        if (chain) this.parent?.triggerWordsChanged(oldCount, newCount, timestamp, true);
    }

    triggerTitleSet(title: string) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.TitleSet, folder: this, data: [title] }, { filter: this }));
    }

    triggerGoalSet(goals: [GOAL, number][]) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.GoalSet, folder: this, data: goals }, { filter: this }));
    }

    triggerCreated() {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.Created, folder: this }, { filter: this }));
    }

    triggerDeleted() {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.Deleted, folder: this }, { filter: this }));
    }

    triggerRenamed(oldName: string, newName: string) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.Renamed, folder: this, data: [oldName, newName] }, { filter: this }));
    }

    isDescendentOf(relative: WSFolder): boolean {
        // if we are root, then instantly false
        if (!(this.parent instanceof WSFolder)) return false;
        // if relative is our parent, true
        if (relative === this.parent) return true;
        // if relative is not our parent, go higher
        return this.parent.isDescendentOf(relative);
    }

    isAncestorOf(relative: WSFile | WSFolder): boolean {
        // if we have no children, we have no descendents
        if (this.childFolders.length === 0 && this.children.length === 0) return false;
        // if relative is a file and one of our children, return true
        if (relative instanceof WSFile && this.children.contains(relative)) return true;
        // if relative is a folder and one of our child folders, return true
        if (relative instanceof WSFolder && this.childFolders.contains(relative)) return true;
        // recurse through child folders until true or out of children
        let descendent = false;
        for (let child of this.childFolders) {
            if (!child.isAncestorOf(relative)) continue;
            descendent = true;
            break;
        }
        return descendent;
    }

}