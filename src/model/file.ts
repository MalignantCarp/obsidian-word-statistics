import type WordStatisticsPlugin from "src/main";
import { WSEvents, WSFileEvent } from "src/model/events";
import type { WSFolder } from "src/model/folder";
import { Settings } from "src/settings";

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
        this.endTime = updateTime;
        if (first) {
            // if this is the first time this file has been counted, whatever the new count is will be imported text
            // it wasn't written, it was pre-existing
            this.wordsImported = newCount;
            return;
        }
        // if the oldCount on the file object itself doesn't match the previous endWords, then it has changed
        // outside of Obsidian, so any content added or deleted is imported or exported prior to whatever
        // the new count will be adding/deleting.
        if (oldCount !== this.endWords) {
            console.log("Words have been imported/exported.", oldCount, this.endWords, Math.max(oldCount - this.endWords, 0), Math.max(this.endWords - oldCount, 0));
            this.wordsImported += Math.max(oldCount - this.endWords, 0);
            this.wordsExported += Math.max(this.endWords - oldCount, 0);
        }
        this.wordsAdded += Math.max(newCount - oldCount, 0);
        this.wordsDeleted += Math.max(oldCount - newCount, 0);
        this.endWords = newCount;
    }
}

export class WSFile {
    constructor(
        public plugin: WordStatisticsPlugin,
        public parent: WSFolder,
        public path: string,
        public name: string,
        public title: string = "",
        public wordCount: number = 0,
        public wordGoal: number = 0,
        public titleYAML: boolean = false,
        public goalYAML: boolean = false,
        public stats: WSFileStat[] = []
    ) {
        if (parent !== null) {
            // console.log(`Adding WSFile(${path}) to parent: ${parent.path}`);
            this.parent.addChild(this);
        }
    }

    clear() {
        this.parent = null;
        this.stats = [];
    }

    getTitle(): string {
        if (this.title != "") return this.title;
        return this.name;
    }

    getWordGoal() {
        if (this.wordGoal > 0) return this.wordGoal;
        let parent = this.parent;
        while (this.parent !== null) {
            if (parent.wordGoalForFiles > 0) return parent.wordGoalForFiles;
            parent = parent.parent;
        }
        return 0;
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

/* #region Statistics */

get startTime() {
    return this.stats.reduce((start, stat) => { return Math.min(start, stat.startTime); }, Number.MAX_SAFE_INTEGER);
}

getStartTimeForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((start, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return Math.min(start, stat.startTime);
        }
        return start;
    }, periodEnd);
}

get startWords() {
    return this.stats.reduce((start, stat) => { return Math.min(start, stat.startWords); }, Number.MAX_SAFE_INTEGER);
}

getStartWordsForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((start, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return Math.min(start, stat.startWords);
        }
        return start;
    }, Number.MAX_SAFE_INTEGER);
}

get endTime() {
    return this.stats.reduce((endTime, stat) => { return Math.max(endTime, stat.endTime); }, 0);
}

getEndTimeForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((endTime, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return Math.min(endTime, stat.endTime);
        }
        return endTime;
    }, periodEnd);
}

get endWords() {
    return this.stats.reduce((endWords, stat) => { return Math.max(endWords, stat.endWords); }, 0);
}

getEndWordsForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((endWords, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return Math.min(endWords, stat.endWords);
        }
        return endWords;
    }, Number.MAX_SAFE_INTEGER);
}

get wordsAdded() {
    return this.stats.reduce((total, stat) => { return total + stat.wordsAdded; }, 0);
}

getWordsAddedForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.wordsAdded;
        }
        return total;
    }, 0);
}

get wordsDeleted() {
    return this.stats.reduce((total, stat) => { return total + stat.wordsDeleted; }, 0);
}

getWordsDeletedForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.wordsDeleted;
        }
        return total;
    }, 0);
}

get wordsImported() {
    return this.stats.reduce((total, stat) => { return total + stat.wordsImported; }, 0);
}

getWordsImportedForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.wordsImported;
        }
        return total;
    }, 0);
}

get wordsExported() {
    return this.stats.reduce((total, stat) => { return total + stat.wordsExported; }, 0);
}

getWordsExportedForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.wordsExported;
        }
        return total;
    }, 0);
}

get writingTime() {
    return this.stats.reduce((total, stat) => { return total + stat.writingTime; }, 0);
}

getWritingTimeForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.writingTime;
        }
        return total;
    }, 0);
}

get duration() {
    return this.stats.reduce((total, stat) => { return total + stat.duration; }, 0);
}

getDurationForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.duration;
        }
        return total;
    }, 0);
}

get netWords() {
    return this.stats.reduce((total, stat) => { return total + stat.netWords; }, 0);
}

getNetWordsForPeriod(periodStart: number, periodEnd: number) {
    return this.stats.reduce((total, stat) => {
        if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
            return total + stat.netWords;
        }
        return total;
    }, 0);
}

get WPM() {
    return this.netWords / this.duration;
}

getWPMPeriod(periodStart: number, periodEnd: number) {
    return this.getNetWordsForPeriod(periodStart, periodEnd) / this.getDurationForPeriod(periodStart, periodEnd);
}

get WPMA() {
    return this.netWords / this.writingTime;
}

getWPMAPeriod(periodStart: number, periodEnd: number) {
    return this.getNetWordsForPeriod(periodStart, periodEnd) / this.getWritingTimeForPeriod(periodStart, periodEnd);
}

get last() {
    return this.stats.last();
}

get first() {
    return this.stats.first();
}

newStat(startTime: number, startWords: number) {
    let stat = new WSFileStat(this, startTime, startWords);
    this.stats.push(stat);
    return stat;
}

canUseLastStat(updateTime: number) {
    if (this.stats.length === 0) return false;
    if (updateTime > this.last.startTime + Settings.Statistics.PERIOD_LENGTH) return false;
    if (updateTime - this.last.endTime > this.plugin.settings.statisticSettings.writingTimeout) return false;
    return true;
}

updateStats(updateTime: number, oldCount: number, newCount: number) {
    // console.log(`updateStat(${this.path} [${this.wordCount}], ${updateTime}, ${oldCount}, ${newCount})`);
    if (!this.parent.isRecording) return;
    // console.log("Okay to record stat.")
    let writingTime = 0;
    let first = false;
    if (this.stats.length === 0) {
        // console.log("This will be the first stat.")
        // this will be the first WSFileStat for this file.
        this.newStat(updateTime, 0);
        first = true;
    } else if (this.plugin.lastFile === this) {
        // console.log("Updating writing time.")
        writingTime = updateTime - this.last.endTime;
    }
    // console.log("Updating stat.")
    this.last.updateStat(updateTime, oldCount, newCount, writingTime, first);
}

/* #endregion */

}