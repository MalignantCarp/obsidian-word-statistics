import { count } from 'console';
import { current_component } from 'svelte/internal';
import type { WSDataCollector } from './collector';
import type { WSFile } from "./file";

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
        let air = currentTime % 30000;
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
        let air = currentTime % 30000;
        let startTime = currentTime - air;
        let recentStart = startTime - this.collector.plugin.settings.statisticSettings.recentDays * 86400000;
        return recentStart;
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
        let air = updateTime % 30000;
        let startTime = updateTime - air;
        return startTime;
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

    initializeCounter(updateTime: number, startWords: number, endWords: number) {
        let current = NewWordCount();
        let startTime = this.getStartTime(updateTime);
        let air = startTime - updateTime;
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
            this.initializeCounter(updateTime, current.endWords, count);
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
    constructor(
        public collector: WSDataCollector,
        public fileMap: Map<WSFile, WSCountHistory>
    ) { }

    onWordCountUpdate(file: WSFile, count: number) {
        let updateTime = Date.now();
        let counter = this.fileMap.get(file);
        if (!(counter instanceof WSCountHistory)) {
            counter = new WSCountHistory(this.collector, file);
            this.fileMap.set(file, counter);
        }
        counter.update(updateTime, count);
    }
}