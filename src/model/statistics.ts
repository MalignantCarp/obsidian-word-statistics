import type { DateTime } from 'luxon';
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

    getPeriodsFromDates(start: DateTime, end?: DateTime) {
        let periods = this.periods.filter((period) => {
            return period.timeStart >= start.toMillis() && period.timeEnd <= (end?.toMillis() || start.toMillis() + Settings.Statistics.DAY_LENGTH);
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