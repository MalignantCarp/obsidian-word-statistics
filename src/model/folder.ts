import type WordStatisticsPlugin from "src/main";
import { Settings } from "src/settings";
import { WSEvents, WSFolderEvent } from "./events";
import type { WSFile } from "./file";

export enum RECORDING {
    OFF = 0,
    ON = 1,
    INHERIT = 2
}

export class WSFolder {
    constructor(
        public plugin: WordStatisticsPlugin,
        public parent: WSFolder,
        public path: string,
        public name: string,
        public title: string,
        public wordCount: number = 0,
        public wordGoalForFiles: number = 0,
        public wordGoalForFolders: number = 0,
        public wordGoal: number = 0,
        public recording: RECORDING = RECORDING.INHERIT,
        public childFolders: WSFolder[] = [],
        public children: WSFile[] = []
    ) {
        if (parent !== null) {
            // console.log(`Adding WSFolder(${path}) to parent: ${parent.path}`);
            this.parent.addChildFolder(this);
        }
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

    moveChildFrom(child: WSFile) {
        let from = child.parent;
        from?.children.remove(child);
        this.addChild(child);
    }

    addChild(child: WSFile) {
        this.children.push(child);
        this.children.sort((a, b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true }));
    }

    moveFolderFrom(childFolder: WSFolder) {
        let from = childFolder.parent;
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

    getWordGoal() {
        if (this.wordGoal > 0) return this.wordGoal;
        let parent = this.parent;
        while (this.parent !== null) {
            if (parent.wordGoalForFolders > 0) return parent.wordGoalForFolders;
            parent = parent.parent;
        }
        return 0;
    }

    propagateWordCountChange(oldCount: number, newCount: number) {
        this.wordCount = this.wordCount - oldCount + newCount;
        this.parent?.propagateWordCountChange(oldCount, newCount);
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

    triggerWordsChanged(oldCount: number, newCount: number, timestamp: number, chain: boolean = false) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.WordsChanged, folder: this, data: [timestamp, oldCount, newCount] }, { filter: this }));
        if (chain) this.parent?.triggerWordsChanged(oldCount, newCount, timestamp, true);
    }

    triggerTitleSet(title: string) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.TitleSet, folder: this, data: [title] }, { filter: this }));
    }

    triggerGoalSet(goal: number) {
        this.plugin.events.trigger(new WSFolderEvent({ type: WSEvents.Folder.GoalSet, folder: this, data: [goal] }, { filter: this }));
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

}