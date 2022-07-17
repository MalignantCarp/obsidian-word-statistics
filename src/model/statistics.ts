import type { WSDataCollector } from './collector';
import { WSFile } from "./file";
import type { WSProject } from './project';

export interface IWordCount {
    air: number,
    startTime: number,
    endTime: number,
    length: number,
    startWords: number,
    endWords: number,
    wordsAdded: number,
    wordsDeleted: number,
    lastWordAt: number,
    writingTime: number;
}

function GetAir(time: number) {
    return (time % 300000); // 300 seconds = 5 minute blocks
}

function NewWordCount(): IWordCount {
    return ({
        air: 0,
        startTime: 0,
        endTime: 0,
        length: 0,
        startWords: 0,
        endWords: 0,
        wordsAdded: 0,
        wordsDeleted: 0,
        lastWordAt: 0,
        writingTime: 0
    });
}

function GetPeriodInfo(newStartTime: number, lastStartTime: number, lastEndTime: number, lastDuration: number, newDuration: number) {
    let normal = 300000;
    let boundary = 60000 * 15; // 15 minute intervals
    let air = newStartTime % normal;
    let startTime = newStartTime - air;
    if (startTime < lastEndTime || startTime < (lastStartTime + lastDuration)) {
        console.log("New time period is out of bounds! Last period ends after start of new period.");
    }
    if (newDuration > boundary) {
        newDuration = boundary;
    }
    return [air, startTime, newDuration];
}


export class WSCountHistory {
    constructor(
        public collector: WSDataCollector,
        public file: WSFile,
        public history: IWordCount[] = []
    ) { }

    get current(): IWordCount {
        if (this.history.length > 0) {
            return this.history.last();
        }
        return undefined;
    }

    get recent(): IWordCount[] {
        let recent: IWordCount[] = [];
        let currentTime = Date.now();
        let air = GetAir(currentTime);
        let startTime = currentTime - air;
        let recentStart = startTime - this.collector.plugin.settings.statisticSettings.recentDays * 86400000;
        for (let counts of this.history) {
            if (counts.startTime >= recentStart) {
                recent.push(counts);
            }
        }
        return recent;
    }

    get recentLimit() {
        let currentTime = Date.now();
        let air = GetAir(currentTime);
        let startTime = currentTime - air;
        let recentStart = startTime - this.collector.plugin.settings.statisticSettings.recentDays * 86400000;
        return recentStart;
    }

    getHistoryForPeriod(startDate: Date, endDate?: Date): IWordCount[] {
        let startTime = startDate.getTime();
        let endTime = startTime + 86400000;
        if (endDate) {
            endTime = endDate.getTime();
        }
        let counters: IWordCount[] = [];
        for (let counter of this.history) {
            if (counter.startTime >= startTime && counter.endTime <= endTime) {
                counters.push(counter);
            }
        }
        return counters;
    }

    consolidate() {
        if (this.collector.plugin.settings.statisticSettings.consolidateHistory) {
            let recentStart = this.recentLimit;
            let newHistory: IWordCount[] = [];
            let size = this.collector.plugin.settings.statisticSettings.historySegmentSize * 3600000;
            let currentWords: IWordCount;
            for (let i = 0; i < this.history.length; i++) {
                let historyItem = this.history[i];
                if (historyItem.endTime < recentStart) {
                    if (currentWords === undefined) {
                        currentWords = Object.assign({}, historyItem);
                    } else {
                        if (currentWords.length + historyItem.length > size) {
                            newHistory.push(currentWords);
                            currentWords = Object.assign({}, historyItem);
                        } else {
                            currentWords.endTime = historyItem.endTime;
                            currentWords.length += historyItem.length;
                            currentWords.endWords = historyItem.endWords;
                            currentWords.wordsAdded += historyItem.wordsAdded;
                            currentWords.wordsDeleted += historyItem.wordsDeleted;
                            currentWords.lastWordAt = historyItem.lastWordAt;
                            currentWords.writingTime += historyItem.writingTime;
                        }
                    }
                } else {
                    if (currentWords === undefined) {
                        newHistory.push(currentWords);
                        currentWords = undefined;
                    }
                    newHistory.push(historyItem);
                }
            }
            this.history = newHistory;
        }
    }

    getStartTime(updateTime: number) {
        let air = GetAir(updateTime);
        let startTime = updateTime - air;
        return [air, startTime];
    }

    getPercentTimeSpentWriting(counter: IWordCount) {
        let writingTime = counter.writingTime;
        let duration = counter.endTime - counter.startTime - counter.air;
        return (writingTime / duration);
    }

    getDuration(counter: IWordCount) {
        return counter.endTime - counter.startTime - counter.air;
    }

    getTotalDuration() {
        let duration = 0;
        for (let counter of this.history) {
            duration += this.getDuration(counter);
        }
        return duration;
    }

    getTotalWritingTime() {
        let writingTime = 0;
        for (let counter of this.history) {
            writingTime += counter.writingTime;
        }
        return writingTime;
    }

    initializeCounter(updateTime: number, startWords: number, endWords: number, previous?: IWordCount) {
        let current = NewWordCount();
        let air: number;
        let startTime: number;
        let duration = this.collector.plugin.settings.statisticSettings.recentSegmentSize * 60000;
        if (previous) {
            [air, startTime, duration] = GetPeriodInfo(updateTime, previous.startTime, previous.endTime, previous.length, duration)
        } else {
            [air, startTime] = this.getStartTime(updateTime);
        }
        current.air = air;
        current.startTime = startTime;
        current.endTime = updateTime;
        current.length = this.collector.plugin.settings.statisticSettings.recentSegmentSize * 60000;
        current.lastWordAt = updateTime;
        current.startWords = startWords;
        current.endWords = endWords;
        current.wordsAdded = 0;
        current.wordsDeleted = 0;
        current.writingTime = 0;
        this.history.push(current);
        return current;
    }

    update(updateTime: number, count: number) {
        let writingTimeout = this.collector.plugin.settings.statisticSettings.writingTimeout * 1000;
        let current = this.current;
        if (current === undefined) {
            current = this.initializeCounter(updateTime, count, count);
        } else if (updateTime > current.startTime + current.length) {
            // if the maximum end point of our existing counter is prior to updateTime,
            // create a new counter for this count update
            this.initializeCounter(updateTime, current.endWords, count, current);
        } else {
            // our update occurs within the prior counter, so now just need to make adjustments
            // first calculcate adjustment to writing time
            let writingGap = updateTime - current.lastWordAt;
            if (writingGap < writingTimeout) {
                current.writingTime += writingGap;
            }
            // should we add writingTimeout to writing time if we have exceeded the writing timeout?
            // we could then just go:
            // current.writingTime += Math.min(updateTime - current.lastWordAt, writingTimeout)
            current.lastWordAt = updateTime;
            let wordsAdded = Math.max(count - current.endWords, 0);
            let wordsDeleted = Math.max(current.endWords - count, 0);
            current.endWords = count;
            current.wordsAdded += wordsAdded;
            current.wordsDeleted += wordsDeleted;
            current.endTime = updateTime;
        }
    }
}

export class WSStatisticManager {
    private locked = true;
    private queue: [file: WSFile, count: number, updateTime: number][] = [];

    constructor(
        public collector: WSDataCollector,
        public fileMap: Map<WSFile, WSCountHistory> = new Map<WSFile, WSCountHistory>()
    ) { }

    unlock() {
        while (this.queue.length > 0) {
            let [file, count, updateTime] = this.queue.shift();
            let counter = this.getHistoryItem(file);
            counter.update(updateTime, count);
        }
        this.locked = false;
    }

    getHistoryItem(file: WSFile): WSCountHistory {
        let counter = this.fileMap.get(file);
        if (!(counter instanceof WSCountHistory)) {
            counter = new WSCountHistory(this.collector, file);
            this.fileMap.set(file, counter);
        }
        return counter;
    }

    onWordCountUpdate(file: WSFile, count: number) {
        let updateTime = Date.now();
        if (!this.locked) {
            let counter = this.getHistoryItem(file);
            counter.update(updateTime, count);
        } else {
            this.queue.push([file, count, updateTime]);
        }
    }

    getExistingHistory() {
        return Array.from(this.fileMap.values()).sort((a, b) =>
            a.file.path.localeCompare(b.file.path, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true })
        );
    }

    loadStats(stats: WSCountHistory[]) {
        // console.log("Loading stats...")
        stats.forEach((stat) => {
            // console.log("for ", stat.file.path, stat);
            this.fileMap.set(stat.file, stat);
        });
    }

    getWPMforPeriod(file: WSFile, index: number = -1): [number, number, number, number] {
        if (file instanceof WSFile && this.fileMap.has(file)) {
            let history = this.fileMap.get(file);
            let counter = history.history.slice(index)[0];
            let duration = counter.endTime - (counter.startTime + counter.air);
            let wpm = counter.wordsAdded / (duration / 60000);
            let wpma = counter.wordsAdded / (counter.writingTime / 60000);
            let nwpm = (counter.endWords - counter.startWords) / (duration / 60000);
            let nwpma = (counter.endWords - counter.startWords) / (counter.writingTime / 60000);
            return [wpm, wpma, nwpm, nwpma];
        }
        return undefined;
    }

    getTotalWPMForHistory(history: IWordCount[]): [number, number, number, number] {
        let totalWordsAdded = 0;
        let totalDuration = 0;
        let totalNetWords = 0;
        let totalWritingTime = 0;
        history.forEach((counter) => {
            totalWordsAdded += counter.wordsAdded;
            totalDuration += (counter.endTime - (counter.startTime + counter.air));
            totalNetWords += (counter.endWords - counter.startWords);
            totalWritingTime += counter.writingTime;
        });
        let wpm = totalWordsAdded / (totalDuration / 60000);
        let wpma = totalWordsAdded / (totalWritingTime / 60000);
        let nwpm = totalNetWords / (totalDuration / 60000);
        let nwpma = totalNetWords / (totalWritingTime / 60000);
        return [wpm, wpma, nwpm, nwpma];
    }

    getTotalWPMForFile(file: WSFile): [number, number, number, number] {
        if (file instanceof WSFile && this.fileMap.has(file)) {
            let history = this.fileMap.get(file);
            return this.getTotalWPMForHistory(history.history)
        }
        return undefined;

    }

    getHistoryForTimePeriod(start: Date, end?: Date, filter?: WSFile[]) {
        let history = new Map<WSFile, IWordCount[]>();

        this.fileMap.forEach((countHistory) => {
            if (filter && !filter.contains(countHistory.file)) {
                return;
            }
            let counters = countHistory.getHistoryForPeriod(start, end);
            if (counters.length > 0) {
                history.set(countHistory.file, counters);
            }
        })
        return history;
    }

    getHistoryForTimePeriodFlat(start: Date, end?: Date, filter?: WSFile[]) {
        let history: IWordCount[] = [];

        this.fileMap.forEach((countHistory) => {
            if (filter && !filter.contains(countHistory.file)) {
                return;
            }
            let counters = countHistory.getHistoryForPeriod(start, end);
            if (counters.length > 0) {
                history.concat(counters);
            }
        })

        return history.sort((a, b) => (a.startTime > b.startTime) ? 1 : (b.startTime > a.startTime) ? -1 : 0);
    }

    flattenHistory(history: Map<WSFile,IWordCount[]>) {
        let flattened: IWordCount[] = [];

        for (let [file, counters] of history) {
            flattened.concat(counters);
        }

        return flattened.sort((a, b) => (a.startTime > b.startTime) ? 1 : (b.startTime > a.startTime) ? -1 : 0);
    }

    getHistoryForProject(project: WSProject) {
        let history = new Map<WSFile, IWordCount[]>();

        project.files.forEach(file => {
            if (this.fileMap.has(file)) {
                history.set(file, this.fileMap.get(file).history);
            }
        })
        return history;
    }

    getHistoryForProjectForPeriod(project: WSProject, start: Date, end?: Date) {
        let pFiles = project.files;
        let history = this.getHistoryForTimePeriod(start, end, pFiles);
        return history;
    }

    getTotalWPMForTimePeriod(start: Date, end?: Date): [number, number, number, number] {
        let history = this.getHistoryForTimePeriodFlat(start, end);

        return this.getTotalWPMForHistory(history);
    }

    getTotalWPMForProject(project: WSProject) {
        let history = this.flattenHistory(this.getHistoryForProject(project));
        return this.getTotalWPMForHistory(history);
    }

    getTotalWPMForProjectForTimePeriod(project: WSProject, start: Date, end?: Date) {
        let history = this.flattenHistory(this.getHistoryForProjectForPeriod(project, start, end));
        return this.getTotalWPMForHistory(history);
    }
}