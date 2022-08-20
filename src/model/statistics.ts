import { Settings } from 'src/settings';
import type { WSDataCollector } from './collector';
import { WSEvents, WSStatEvent } from './event';
import type { WSFile } from "./file";
import type { WSProjectManager } from './manager';
import type { WSProject } from './project';

export namespace Statistics {
    export function RecordStatsFor(file: WSFile, manager: WSProjectManager) {
        return manager.collector.pluginSettings.statisticSettings.record == Settings.Statistics.MONITOR.ALL ||
            (manager.collector.pluginSettings.statisticSettings.record == Settings.Statistics.MONITOR.PROJECTS && manager.getProjectsByFile(file).length > 0) ||
            (manager.collector.pluginSettings.statisticSettings.record == Settings.Statistics.MONITOR.MONITORED && manager.getProjectsByFile(file).filter(project => project.monitorCounts).length > 0);
    };
}

export interface IWordCount {
    air: number,
    startTime: number,
    endTime: number,
    startWords: number,
    endWords: number,
    wordsAdded: number,
    wordsDeleted: number,
    wordsImported: number,
    wordsExported: number,
    lastWordAt: number,
    writingTime: number;
}

function NewWordCount(): IWordCount {
    return ({
        air: 0,
        startTime: 0,
        endTime: 0,
        startWords: 0,
        endWords: 0,
        wordsAdded: 0,
        wordsDeleted: 0,
        wordsImported: 0,
        wordsExported: 0,
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

    // get recent(): IWordCount[] {
    //     let recent: IWordCount[] = [];
    //     let currentTime = Date.now();
    //     let [air, startTime] = this.getStartTime(currentTime);
    //     let recentStart = startTime - this.collector.plugin.settings.statisticSettings.recentDays * 86400000;
    //     for (let counts of this.history) {
    //         if (counts.startTime >= recentStart) {
    //             recent.push(counts);
    //         }
    //     }
    //     return recent;
    // }

    // get recentLimit() {
    //     let currentTime = Date.now();
    //     let [air, startTime] = this.getStartTime(currentTime);
    //     let recentStart = startTime - this.collector.plugin.settings.statisticSettings.recentDays * 86400000;
    //     return recentStart;
    // }

    getHistoryForPeriod(startDate: Date, endDate?: Date): IWordCount[] {
        let startTime = startDate.getTime();
        let endTime = startTime + Settings.Statistics.DAY_LENGTH;
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

    // consolidate() {
    //     if (this.collector.plugin.settings.statisticSettings.consolidateHistory) {
    //         let recentStart = this.recentLimit;
    //         let newHistory: IWordCount[] = [];
    //         let size = this.collector.plugin.settings.statisticSettings.historySegmentSize * 3600000;
    //         let currentWords: IWordCount;
    //         for (let i = 0; i < this.history.length; i++) {
    //             let historyItem = this.history[i];
    //             if (historyItem.endTime < recentStart) {
    //                 if (currentWords === undefined) {
    //                     currentWords = Object.assign({}, historyItem);
    //                 } else {
    //                     if (currentWords.length + historyItem.length > size) {
    //                         newHistory.push(currentWords);
    //                         currentWords = Object.assign({}, historyItem);
    //                     } else {
    //                         currentWords.endTime = historyItem.endTime;
    //                         currentWords.length += historyItem.length;
    //                         currentWords.endWords = historyItem.endWords;
    //                         currentWords.wordsAdded += historyItem.wordsAdded;
    //                         currentWords.wordsDeleted += historyItem.wordsDeleted;
    //                         currentWords.lastWordAt = historyItem.lastWordAt;
    //                         currentWords.writingTime += historyItem.writingTime;
    //                     }
    //                 }
    //             } else {
    //                 if (currentWords === undefined) {
    //                     newHistory.push(currentWords);
    //                     currentWords = undefined;
    //                 }
    //                 newHistory.push(historyItem);
    //             }
    //         }
    //         this.history = newHistory;
    //     }
    // }

    getStartTime(updateTime: number) {
        let boundary = Settings.Statistics.PERIOD_LENGTH;
        let air = updateTime % boundary;
        let startTime = updateTime - air;
        return [air, startTime];
    }

    getPercentTimeSpentWriting(counter: IWordCount) {
        let writingTime = counter.writingTime;
        let duration = counter.endTime - (counter.startTime + counter.air);
        return (writingTime / duration);
    }

    getDuration(counter: IWordCount) {
        return counter.endTime - (counter.startTime + counter.air);
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

    nextCounter(updateTime: number, oldCount: number, newCount: number) {
        let current = NewWordCount();
        let air: number;
        let startTime: number;
        [air, startTime] = this.getStartTime(updateTime);
        current.air = air;
        current.startTime = startTime;
        current.endTime = updateTime;
        current.lastWordAt = updateTime;
        current.startWords = oldCount; // previous word count
        current.endWords = newCount; // new word count
        current.wordsAdded = 0;
        current.wordsDeleted = 0;
        // any difference between the existing counter and the next one
        // occurred outside of Obsidian, so any change is imported or exported
        // words
        current.wordsImported = Math.max(newCount - oldCount, 0);
        current.wordsExported = Math.max(oldCount - newCount, 0);
        current.writingTime = 0;
        this.history.push(current);
        return current;
    }


    firstCounter(updateTime: number, oldCount: number, newCount: number) {
        let current = NewWordCount();
        let air: number;
        let startTime: number;
        [air, startTime] = this.getStartTime(updateTime);
        current.air = air;
        current.startTime = startTime;
        current.endTime = updateTime;
        current.lastWordAt = updateTime;
        current.startWords = oldCount; // previous word count
        current.endWords = newCount; // new word count
        // if we are a new counter with no history, any existing words were imported
        current.wordsImported = current.startWords;
        current.wordsExported = 0;
        // if there is a difference between the original count and the current count,
        // words were added or deleted
        current.wordsAdded = Math.max(newCount - oldCount, 0);
        current.wordsDeleted = Math.max(oldCount - newCount, 0);
        current.writingTime = 0;
        this.history.push(current);
        return current;
    }

    silentUpdate(updateTime: number) {
        let writingTimeout = this.collector.plugin.settings.statisticSettings.writingTimeout * 1000;
        let current = this.current;
        // if we don't have an object or would otherwise change this object,
        // we don't need to do anything
        if (current === undefined || updateTime > current.startTime + Settings.Statistics.PERIOD_LENGTH) {
            return;
        }
        // Now just need to make adjustments to writing time and lastWordAt
        // first calculcate adjustment to writing time
        let writingGap = updateTime - current.lastWordAt;
        if (writingGap < writingTimeout) {
            current.writingTime += writingGap;
        }

        current.lastWordAt = updateTime;
        current.endTime = updateTime;
    }

    update(updateTime: number, oldCount: number, newCount: number) {
        let writingTimeout = this.collector.plugin.settings.statisticSettings.writingTimeout * 1000;
        let current = this.current;
        if (current === undefined) {
            current = this.firstCounter(updateTime, oldCount, newCount);
            return;
        } else if (updateTime > current.startTime + Settings.Statistics.PERIOD_LENGTH) {
            // if the maximum end point of our existing counter is prior to updateTime,
            // create a new counter for this count update
            current = this.nextCounter(updateTime, current.endWords, oldCount);
        }
        // Now just need to make adjustments
        // first calculcate adjustment to writing time
        let writingGap = updateTime - current.lastWordAt;
        if (writingGap < writingTimeout) {
            current.writingTime += writingGap;
        }
        // should we add writingTimeout to writing time if we have exceeded the writing timeout?
        // we could then just go:
        // current.writingTime += Math.min(updateTime - current.lastWordAt, writingTimeout)
        current.lastWordAt = updateTime;
        let wordsAdded = Math.max(newCount - current.endWords, 0);
        let wordsDeleted = Math.max(current.endWords - newCount, 0);
        current.endWords = newCount;
        current.wordsAdded += wordsAdded;
        current.wordsDeleted += wordsDeleted;
        current.endTime = updateTime;
    }
}

export interface IFileStat {
    timeStart: number,
    timeEnd: number,
    wordsStart: number,
    wordsEnd: number,
    wordsAdded: number,
    wordsDeleted: number,
    wordsImported: number,
    wordsExported: number,
    wordsUpdatedAt: number,
    writingTime: number;
}

export interface IFileWrapper {
    file: WSFile,
    stats: IFileStat;
}

export class WSTimePeriod {
    constructor(
        public manager: WSStatisticsManager,
        public timeStart: number,
        public timeEnd: number = 0,
        public expiry: number = 0,
        public files: IFileWrapper[] = [],
        public base: number = 0,
        public wordsStart: number = 0,
        public wordsEnd: number = 0,
        public wordsAdded: number = 0,
        public wordsDeleted: number = 0,
        public wordsImported: number = 0,
        public wordsExported: number = 0,
        public wordsUpdatedAt: number = 0,
        public writingTime: number = 0,
    ) {
        if (this.base === 0) {
            this.base = this.timeStart - (this.timeStart % Settings.Statistics.PERIOD_LENGTH);
        }
        if (this.expiry === 0) {
            this.expiry = this.base + Settings.Statistics.PERIOD_LENGTH;
        }
        if (this.timeEnd === 0) {
            this.timeEnd = this.timeStart;
        }
    }

    get current(): IFileWrapper {
        return this.files.length > 0 ? this.files.slice(-1).first() : undefined;
    }

    silentUpdate(file: WSFile, updateTime: number, oldCount: number, newCount: number): any {
        // we know in this case oldCount and newCount should be identical, so no making any word count changes
        if (updateTime > this.expiry) return undefined; // do not update if we're expired

        this.wordsUpdatedAt = updateTime;
        let last = this.current;
        /* We don't want to do anything where we'd be creating a new statistics object. */
        if (last === undefined || last.file != file) return undefined;

        let writingTimeout = this.manager.collector.plugin.settings.statisticSettings.writingTimeout * 1000;
        let writingGap = updateTime - last.stats.wordsUpdatedAt;
        if (writingGap < writingTimeout) {
            last.stats.writingTime += writingGap;
            this.writingTime += writingGap;
        }
        last.stats.wordsUpdatedAt = updateTime;
        last.stats.timeEnd = updateTime;
        this.timeEnd = updateTime;
    }

    update(file: WSFile, updateTime: number, oldCount: number, newCount: number) {
        if (updateTime > this.expiry) return undefined; // do not update if we're expired
        this.wordsUpdatedAt = updateTime;
        let last = this.current;
        if (last === undefined || last.file != file) {
            // if there is no current file wrapper or it is for a different file
            last = this.manager.fileHistory.get(file)?.last(); // get the last history object for that file
            let newFile: IFileWrapper;
            if (last === undefined) {
                // if last is still undefined, we've never done anything with this file before, so create a fully new one
                newFile = {
                    file, stats: {
                        timeStart: updateTime,
                        timeEnd: updateTime,
                        wordsStart: oldCount,
                        wordsEnd: newCount,
                        wordsAdded: Math.max(0, newCount - oldCount),
                        wordsDeleted: Math.max(0, oldCount - newCount),
                        wordsImported: oldCount,
                        wordsExported: 0,
                        wordsUpdatedAt: updateTime,
                        writingTime: 0
                    }
                };
                this.wordsStart += oldCount;
                this.wordsEnd += newCount;
                this.wordsImported += oldCount;
                this.wordsAdded += newFile.stats.wordsAdded;
                this.wordsDeleted += newFile.stats.wordsDeleted;
            } else {
                newFile = {
                    file, stats: {
                        timeStart: updateTime,
                        timeEnd: updateTime,
                        wordsStart: last.stats.wordsEnd,
                        wordsEnd: newCount,
                        wordsAdded: Math.max(0, newCount - oldCount),
                        wordsDeleted: Math.max(0, oldCount - newCount),
                        wordsImported: Math.max(0, oldCount - last.stats.wordsEnd),
                        wordsExported: Math.max(0, last.stats.wordsEnd - oldCount),
                        wordsUpdatedAt: updateTime,
                        writingTime: 0
                    }
                };
                this.wordsAdded += newFile.stats.wordsAdded;
                this.wordsDeleted += newFile.stats.wordsDeleted;
                this.wordsImported += newFile.stats.wordsImported;
                this.wordsExported += newFile.stats.wordsExported;
                this.wordsEnd += newFile.stats.wordsAdded - newFile.stats.wordsDeleted + newFile.stats.wordsImported - newFile.stats.wordsExported;
            }
            this.files.push(newFile);
            return newFile;
        } else {
            let wordsAdded = Math.max(0, newCount - oldCount);
            let wordsDeleted = Math.max(0, oldCount - newCount);
            let wordsImported = Math.max(0, oldCount - last.stats.wordsEnd);
            let wordsExported = Math.max(0, last.stats.wordsEnd - oldCount);

            last.stats.wordsEnd = newCount;
            last.stats.wordsAdded += wordsAdded;
            last.stats.wordsDeleted += wordsDeleted;
            last.stats.wordsImported += wordsImported;
            last.stats.wordsExported += wordsExported;

            let writingTimeout = this.manager.collector.plugin.settings.statisticSettings.writingTimeout * 1000;
            let writingGap = updateTime - last.stats.wordsUpdatedAt;
            if (writingGap < writingTimeout) {
                last.stats.writingTime += writingGap;
                this.writingTime += writingGap;
            }

            this.wordsAdded += wordsAdded;
            this.wordsDeleted += wordsDeleted;
            this.wordsImported += wordsImported;
            this.wordsExported += wordsExported;
            this.wordsEnd += wordsAdded - wordsDeleted + wordsImported - wordsExported;

            last.stats.wordsUpdatedAt = updateTime;
            last.stats.timeEnd = updateTime;
            this.timeEnd = updateTime;
        }
    }
}

export class WSStatisticsManager {
    private locked = true;
    private queue: [file: WSFile, oldCount: number, newCount: number, updateTime: number, silent: boolean][] = [];

    constructor(
        public collector: WSDataCollector,
        public fileHistory: Map<WSFile, IFileWrapper[]> = new Map<WSFile, IFileWrapper[]>(),
        public periods: WSTimePeriod[] = [],
    ) { }

    unlock() {
        while (this.queue.length > 0) {
            let [file, updateTime, oldCount, newCount, silent] = this.queue.shift();
            this.updatePeriods(updateTime);
            if (silent) {
                this.processSilentUpdate(file, updateTime, oldCount, newCount);
            } else {
                this.processUpdate(file, updateTime, oldCount, newCount);
            }
        }
        this.locked = false;
    }

    processUpdate(file: WSFile, updateTime: number, oldCount: number, newCount: number) {
        let newFile = this.currentPeriod?.update(file, updateTime, oldCount, newCount);
        if (newFile === undefined) return;
        if (this.fileHistory.has(file)) {
            this.fileHistory.get(file).push(newFile);
        } else {
            this.collector.plugin.events.trigger(new WSStatEvent({ type: WSEvents.Stats.FileTouch, period: this.currentPeriod, file: newFile }, { filter: null }));
            this.fileHistory.set(file, [newFile]);
        }
    }

    processSilentUpdate(file: WSFile, updateTime: number, oldCount: number, newCount: number) {
        this.currentPeriod?.silentUpdate(file, updateTime, oldCount, newCount);
    }

    onSilentUpdate(updateTime: number, file: WSFile, oldCount: number, newCount: number) {
        if (!this.locked) {
            this.updatePeriods(updateTime);
            this.processSilentUpdate(file, updateTime, oldCount, newCount);
        } else {
            this.queue.push([file, updateTime, oldCount, newCount, true]);
        }
    }

    onWordCountUpdate(updateTime: number, file: WSFile, oldCount: number, newCount: number) {
        // console.log(this.locked, updateTime, file.path, oldCount, newCount);
        if (!this.locked) {
            this.updatePeriods(updateTime);
            this.processUpdate(file, updateTime, oldCount, newCount);
        } else {
            this.queue.push([file, updateTime, oldCount, newCount, false]);
        }
    }

    get currentPeriod(): WSTimePeriod {
        return this.periods.length > 0 ? this.periods.last() : undefined;
    }

    updatePeriods(updateTime: number) {
        let current = this.currentPeriod;
        if (current === undefined || current.expiry < updateTime) {
            let newPeriod = new WSTimePeriod(this, updateTime);
            this.periods.push(newPeriod);
        }
    }

    loadStats(stats: WSTimePeriod[]) {
        // console.log("Loading stats...")
        this.periods = stats;
        stats.forEach((stat) => {
            stat.files.forEach((fileWrap) => {
                if (!this.fileHistory.has(fileWrap.file)) {
                    this.fileHistory.set(fileWrap.file, [fileWrap]);
                    this.collector.plugin.events.trigger(new WSStatEvent({ type: WSEvents.Stats.FileTouch, period: this.currentPeriod, file: fileWrap }, { filter: null }));
                } else {
                    this.fileHistory.get(fileWrap.file).push(fileWrap);
                }
            });
        });
    }

    getWPMFromStats(stats: IFileStat[]): [number, number, number, number] {
        let duration = 0;
        let wordsAdded = 0;
        let wordsDeleted = 0;
        let writingTime = 0;
        stats.forEach(stat => {
            duration += stat.timeEnd - stat.timeStart;
            wordsAdded += stat.wordsAdded;
            wordsDeleted += stat.wordsDeleted;
            writingTime += stat.writingTime;
        });
        duration = Math.round(duration / 1000) / 60;
        writingTime = Math.round(writingTime / 1000) / 60;
        let netWords = wordsAdded - wordsDeleted;
        let wpm = wordsAdded / duration;
        let wpma = wordsAdded / writingTime;
        let nwpm = netWords / duration;
        let nwpma = netWords / writingTime;
        return [wpm, wpma, nwpm, nwpma];
    }

    getWPMFromWrappers(wrappers: IFileWrapper[], filter: WSFile[] = []): [number, number, number, number] {
        let duration = 0;
        let wordsAdded = 0;
        let wordsDeleted = 0;
        let writingTime = 0;
        wrappers.forEach(wrapper => {
            if (filter.length === 0 || filter.contains(wrapper.file)) {
                duration += wrapper.stats.timeEnd - wrapper.stats.timeStart;
                wordsAdded += wrapper.stats.wordsAdded;
                wordsDeleted += wrapper.stats.wordsDeleted;
                writingTime += wrapper.stats.writingTime;
            }
        });
        duration = Math.round(duration / 1000) / 60;
        writingTime = Math.round(writingTime / 1000) / 60;
        let netWords = wordsAdded - wordsDeleted;
        let wpm = wordsAdded / duration;
        let wpma = wordsAdded / writingTime;
        let nwpm = netWords / duration;
        let nwpma = netWords / writingTime;
        return [wpm, wpma, nwpm, nwpma];
    }

    getWPMFromPeriod(period: WSTimePeriod, filter: WSFile[] = []): [number, number, number, number] {
        if (filter) {
            let stats = period.files.filter(wrapper => filter.contains(wrapper.file));
            let statArray = stats.map(stat => stat.stats);
            return this.getWPMFromStats(statArray);
        } else {
            let duration = period.timeEnd - period.timeStart;
            let wpm = period.wordsAdded / (duration / 60000);
            let wpma = period.wordsAdded / (period.writingTime / 60000);
            let nwpm = (period.wordsAdded - period.wordsDeleted) / (duration / 60000);
            let nwpma = (period.wordsAdded - period.wordsDeleted) / (period.writingTime / 60000);
            return [wpm, wpma, nwpm, nwpma];
        }
    }

    getWPMFromFile(file: WSFile): [number, number, number, number] {
        let wrappers: IFileWrapper[] = this.fileHistory.get(file);
        if (wrappers) {
            return this.getWPMFromWrappers(wrappers);
        }
        return undefined;
    }

    getStatsFromWrappers(wrappers: IFileWrapper[], filter: WSFile[] = []) {
        let stats: IFileStat[] = [];
        wrappers.forEach(wrapper => {
            if (filter.length === 0 || filter.contains(wrapper.file)) {
                stats.concat(wrapper.stats);
            }
        });
        return stats;
    }

    getWrappersFromPeriods(periods: WSTimePeriod[]) {
        let wrappers: IFileWrapper[] = [];
        periods.forEach(period => {
            wrappers.concat(period.files);
        });
        return wrappers;
    }

    getPeriodsFromDates(start: Date, end?: Date) {
        let periods = this.periods.filter((period) => {
            return period.timeStart >= start.getTime() && period.timeEnd <= (end?.getTime() || start.getTime() + Settings.Statistics.DAY_LENGTH);
        });
        return periods;
    }

    getWrappersForProject(project: WSProject) {
        let history = new Map<WSFile, IFileWrapper[]>();

        project.files.forEach(file => {
            if (this.fileHistory.has(file)) {
                history.set(file, this.fileHistory.get(file));
            }
        });
        return history;
    }

    getPeriodsForProject(project: WSProject) {
        let times: Set<number> = new Set<number>;
        let wrappers: IFileWrapper[] = [];

        project.files.forEach(file => {
            if (this.fileHistory.has(file)) {
                wrappers.concat(this.fileHistory.get(file));
            }
        });
        // we know that all time periods begin on a 15-minute mark and are at most 15 minutes in duration, so only need the start times
        wrappers.forEach(wrapper => {
            times.add(wrapper.stats.timeStart - (wrapper.stats.timeStart % Settings.Statistics.PERIOD_LENGTH));
        });
        return this.periods.filter(period => times.has(period.base));
    }
}