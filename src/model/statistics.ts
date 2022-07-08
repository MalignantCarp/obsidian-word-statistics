import { count } from 'console';
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

    update(updateTime: number, count: number) {
        let writingTimeout = this.collector.plugin.settings.statisticSettings.writingTimeout * 1000;
        let current = this.current;
        let lastCount = count;
        if (current !== undefined && current.startTime + current.length < updateTime) {
            // This segment ended prior to this update
            current.endTime = current.startTime + current.length;
            let newStart = current.endTime;
            let timeout = current.lastWordAt + writingTimeout;
            let additionalWritingTime = 0;
            if (timeout < updateTime) {
                // Writing stopped prior to this update
                if (timeout < current.endTime) {
                    // Writing stopped prior to end of current segment
                    current.writingTime += timeout - current.lastWordAt;
                } else {
                    // writing timed out after current segment, before this update
                    current.writingTime += current.endTime - current.lastWordAt;
                    additionalWritingTime = writingTimeout - (current.endTime - current.lastWordAt);
                }
            } else {
                // Still writing
                current.writingTime += current.endTime - current.lastWordAt;
                current.lastWordAt = current.endTime;
            }
            lastCount = current.endWords;
            current = NewWordCount();
            this.history.push(current);
            current.startTime = newStart;
            current.startWords = lastCount;
            current.endWords = lastCount;

        } else if (current === undefined) {
            current = NewWordCount();
            this.history.push(current);
            let air = updateTime % 30000;
            let newStart = updateTime - air;
            current.air = air;
            current.startTime = newStart;
            current.endTime = newStart;
            current.startWords = count;
            current.endWords = count;
        }
        let wordsAdded = Math.max(count - current.endWords, 0);
        let wordsDeleted = Math.max(current.endWords - count, 0);
        current.endWords = count;
        current.wordsAdded += wordsAdded;
        current.wordsDeleted += wordsDeleted;
        current.lastWordAt = updateTime;
        current.endTime = updateTime;
    }
}

export class WSStatisticManager {
    public active: WSFile[] = [];

    constructor(
        public collector: WSDataCollector,
        public fileMap: Map<WSFile, WSCountHistory>
    ) { }

    onTimer() {

    }
}