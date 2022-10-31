import type WordStatisticsPlugin from "src/main";
import { WSEvents, WSFileEvent } from "src/model/events";
import type { WSFolder } from "src/model/folder";
import { Settings } from "src/settings";
import { StatsPropagate, WordStats } from "./stats";

export class WSFileStat {
    constructor(
        public file: WSFile,
        public startTime: number,
        public startWords: number,
        public endTime: number = 0,
        public endWords: number = 0,
        public wordsAdded: number = 0,
        public wordsDeleted: number = 0,
        public wordsImported: number = 0,
        public wordsExported: number = 0,
        public writingTime: number = 0
    ) {
        if (endTime === 0) this.endTime = this.startTime;
        if (endWords === 0) this.endWords = this.startWords;
    }

    get duration() {
        return this.endTime - this.startTime;
    }

    get netWords() {
        return this.wordsAdded + this.wordsImported - this.wordsDeleted - this.wordsExported;
    }

    get WPM() {
        return this.netWords / this.duration;
    }

    get WPMA() {
        return this.netWords / this.writingTime;
    }

    updateStat(updateTime: number, oldCount: number, newCount: number, writingTime: number, first: boolean = false) {
        this.writingTime += writingTime;

        let duration = updateTime - this.endTime;
        this.endTime = updateTime;

        let endTime = updateTime;
        let wordsImported = 0;
        let wordsExported = 0;
        let wordsAdded = 0;
        let wordsDeleted = 0;
        let endWords = newCount;

        if (first) {
            // if this is the first time this file has been counted, whatever the new count is will be imported text
            // it wasn't written, it was pre-existing
            wordsImported = newCount;
        } else {
            // if the oldCount on the file object itself doesn't match the previous endWords, then it has changed
            // outside of Obsidian, so any content added or deleted is imported or exported prior to whatever
            // the new count will be adding/deleting.
            if (oldCount !== this.endWords) {
                console.log("Words have been imported/exported.", oldCount, this.endWords, Math.max(oldCount - this.endWords, 0), Math.max(this.endWords - oldCount, 0));
                wordsImported += Math.max(oldCount - this.endWords, 0);
                wordsExported += Math.max(this.endWords - oldCount, 0);
            }
            wordsAdded += Math.max(newCount - oldCount, 0);
            wordsDeleted += Math.max(oldCount - newCount, 0);
        }
        this.endTime = endTime;
        this.wordsImported += wordsImported;
        this.wordsExported += wordsExported;
        this.wordsAdded += wordsAdded;
        this.wordsDeleted += wordsDeleted;
        this.endWords = endWords;

        this.file.propagateEndTime(endTime);
        if (duration > 0) this.file.propagateDuration(duration);
        if (wordsAdded > 0) this.file.propagateWordsAdded(wordsAdded);
        if (wordsDeleted > 0) this.file.propagateWordsDeleted(wordsDeleted);
        if (wordsImported > 0) this.file.propagateWordsImported(wordsImported);
        if (wordsExported > 0) this.file.propagateWordsExported(wordsExported);
        if (writingTime > 0) this.file.propagateWritingTime(writingTime);
    }
}

export class WSFile extends StatsPropagate{
    constructor(
        public plugin: WordStatisticsPlugin,
        public parent: WSFolder,
        public path: string,
        public name: string,
        public basename: string,
        public title: string = "",
        public wordCount: number = 0,
        public wordGoal: number = 0,
        public stats: WSFileStat[] = [],
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
            // console.log(`Adding WSFile(${path}) to parent: ${parent.path}`);
            this.parent.addChild(this);
        }
    }

    clear() {
        this.parent = null;
        this.stats = [];
    }

    recalculateStats() {
        if (this.stats.length > 0) {
            this.startTime = WordStats.GetStartTime(this.stats);
            this.endTime = WordStats.GetEndTime(this.stats);
            this.duration = WordStats.GetDuration(this.stats);
            this.startWords = WordStats.GetStartWords(this.stats);
            this.endWords = WordStats.GetEndWords(this.stats);
            this.wordsAdded = WordStats.GetWordsAdded(this.stats);
            this.wordsDeleted = WordStats.GetWordsDeleted(this.stats);
            this.wordsImported = WordStats.GetWordsImported(this.stats);
            this.wordsExported = WordStats.GetWordsExported(this.stats);
            this.netWords = WordStats.GetNetWords(this.stats);
            this.writingTime = WordStats.GetWritingTime(this.stats);
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
    }

    getTitle(): string {
        if (this.title !== "") return this.title;
        return this.basename;
    }

    getWordGoal() {
        if (this.wordGoal > 0) return this.wordGoal;
        let ancestor = this.parent;
        while (ancestor !== null) {
            if (ancestor.wordGoalForFiles > 0) return ancestor.wordGoalForFiles;
            ancestor = ancestor.parent;
        }
        return 0;
    }

    getGoalParents() {
        let ancestor = this.parent;
        let parents: WSFolder[] = [];
        while (ancestor !== null) {
            parents.push(ancestor);
            ancestor = ancestor.parent;
        }
        let lastGoalIndex = -1;
        for (let i = parents.length - 1; i >= 0; i--) {
            if (parents[i].getWordGoal() > 0) {
                lastGoalIndex = i;
                break;
            }
        }
        return lastGoalIndex > 0 ? parents.slice(0, lastGoalIndex + 1) : [];
    }

    propagateWordCountChange(oldCount: number, newCount: number) {
        this.parent?.propagateWordCountChange(oldCount, newCount);
    }

    triggerWordsChanged(oldCount: number, newCount: number, timestamp: number, chain: boolean = false) {
        this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.WordsChanged, file: this, data: [timestamp, oldCount, newCount] }, { filter: this }));
        if (chain) this.parent?.triggerWordsChanged(oldCount, newCount, timestamp, true);
    }

    triggerTitleSet(title: string) {
        this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.TitleSet, file: this, data: [title] }, { filter: this }));
    }

    triggerGoalSet(goal: number) {
        this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.GoalSet, file: this, data: [goal] }, { filter: this }));
    }

    triggerCreated() {
        this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.Created, file: this }, { filter: this }));
    }

    triggerDeleted() {
        this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.Deleted, file: this }, { filter: this }));
    }

    triggerRenamed(oldName: string, newName: string) {
        this.plugin.events.trigger(new WSFileEvent({ type: WSEvents.File.Renamed, file: this, data: [oldName, newName] }, { filter: this }));
    }

    get last() {
        return this.stats.last();
    }

    get first() {
        return this.stats.first();
    }

    get hasStats() {
        return this.stats.length > 0;
    }

    newStat(startTime: number, startWords: number) {
        let stat = new WSFileStat(this, startTime, startWords);
        this.stats.push(stat);
        return stat;
    }

    canUseLastStat(updateTime: number) {
        // console.log(this.path, updateTime, this.last.startTime - (this.last.startTime % Settings.Statistics.PERIOD_LENGTH) + Settings.Statistics.PERIOD_LENGTH,
        //     updateTime - this.last.endTime,
        //     updateTime - (this.last.startTime - (this.last.startTime % Settings.Statistics.PERIOD_LENGTH) + Settings.Statistics.PERIOD_LENGTH),
        //     updateTime > this.last.startTime - (this.last.startTime % Settings.Statistics.PERIOD_LENGTH) + Settings.Statistics.PERIOD_LENGTH,
        //     updateTime - this.last.endTime > this.plugin.settings.statistics.writingTimeout*1000,
        //     this.plugin.lastFile === this);
        // console.log(this.plugin.lastFile?.path);
        // We check this in updateStats already, so no need to have it here anymore.
        // if (this.stats.length === 0) return false;
        if (updateTime > this.last.startTime - (this.last.startTime % Settings.Statistics.PERIOD_LENGTH) + Settings.Statistics.PERIOD_LENGTH) return false;
        // if (updateTime - this.last.endTime > this.plugin.settings.statistics.writingTimeout*1000) return false;
        return this.plugin.lastFile === this;
    }

    updateStats(updateTime: number, oldCount: number, newCount: number) {
        // console.log(`updateStat(${this.path} [${this.wordCount}], ${updateTime}, ${oldCount}, ${newCount})`);
        if (!this.parent.isRecording) return;
        // console.log("Okay to record stat.")
        let writingTime = 0;
        if (this.stats.length === 0) {
            // console.log("This will be the first stat.")
            // this will be the first WSFileStat for this file.
            this.newStat(updateTime, 0);
            this.last.updateStat(updateTime, oldCount, oldCount, writingTime, true);
        } else if (this.canUseLastStat(updateTime)) {
            // console.log("Updating writing time.")
            writingTime = updateTime - this.last.endTime > this.plugin.settings.statistics.writingTimeout * 1000 ? 0 : updateTime - this.last.endTime;
        } else {
            // console.log("Cannot use last stat. Creating new one.", updateTime, this.last.endWords)
            this.newStat(updateTime, this.last.endWords);
        }
        // console.log("Updating stat.")
        this.last.updateStat(updateTime, oldCount, newCount, writingTime);
    }

}