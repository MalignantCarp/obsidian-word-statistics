import type { DateTime } from "luxon";
import type WordStatisticsPlugin from "src/main";
import { Settings } from "src/settings";
import type { WSFileStat, WSFile } from "./file";

export namespace WordStats {
    export function getStartTime(stats: WSFileStat[]) {
        return stats.reduce((start, stat) => { return Math.min(start, stat.startTime); }, Number.MAX_SAFE_INTEGER);
    }

    export function getStartTimeForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((start, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return Math.min(start, stat.startTime);
            }
            return start;
        }, periodEnd);
    }

    export function GetStartWords(stats: WSFileStat[]) {
        return stats.reduce((start, stat) => { return Math.min(start, stat.startWords); }, Number.MAX_SAFE_INTEGER);
    }

    export function GetStartWordsForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((start, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return Math.min(start, stat.startWords);
            }
            return start;
        }, Number.MAX_SAFE_INTEGER);
    }

    export function GetEndTime(stats: WSFileStat[]) {
        return stats.reduce((endTime, stat) => { return Math.max(endTime, stat.endTime); }, 0);
    }

    export function GetEndTimeForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((endTime, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return Math.min(endTime, stat.endTime);
            }
            return endTime;
        }, periodEnd);
    }

    export function GetEndWords(stats: WSFileStat[]) {
        return stats.reduce((endWords, stat) => { return Math.max(endWords, stat.endWords); }, 0);
    }

    export function GetEndWordsForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((endWords, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return Math.min(endWords, stat.endWords);
            }
            return endWords;
        }, Number.MAX_SAFE_INTEGER);
    }

    export function GetWordsAdded(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsAdded; }, 0);
    }

    export function GetWordsAddedForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.wordsAdded;
            }
            return total;
        }, 0);
    }

    export function GetWordsDeleted(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsDeleted; }, 0);
    }

    export function GetWordsDeletedForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.wordsDeleted;
            }
            return total;
        }, 0);
    }

    export function GetWordsImported(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsImported; }, 0);
    }

    export function GetWordsImportedForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.wordsImported;
            }
            return total;
        }, 0);
    }

    export function GetWordsExported(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsExported; }, 0);
    }

    export function GetWordsExportedForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.wordsExported;
            }
            return total;
        }, 0);
    }

    export function GetWritingTime(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.writingTime; }, 0);
    }

    export function GetWritingTimeForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.writingTime;
            }
            return total;
        }, 0);
    }

    export function GetDuration(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.duration; }, 0);
    }

    export function GetDurationForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.duration;
            }
            return total;
        }, 0);
    }

    export function GetNetWords(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.netWords; }, 0);
    }

    export function GetNetWordsForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return stats.reduce((total, stat) => {
            if (stat.startTime >= periodStart && stat.endTime <= periodEnd) {
                return total + stat.netWords;
            }
            return total;
        }, 0);
    }

    export function GetWPM(stats: WSFileStat[]) {
        return GetNetWords(stats) / GetDuration(stats);
    }

    export function GetWPMPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return GetNetWordsForPeriod(stats, periodStart, periodEnd) / GetDurationForPeriod(stats, periodStart, periodEnd);
    }

    export function GetWAPM(stats: WSFileStat[]) {
        return GetWordsAdded(stats) / GetDuration(stats);
    }

    export function GetWAPMPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return GetWordsAddedForPeriod(stats, periodStart, periodEnd) / GetDurationForPeriod(stats, periodStart, periodEnd);
    }

    export function GetWPMA(stats: WSFileStat[]) {
        return GetNetWords(stats) / GetWritingTime(stats);
    }

    export function GetWPMAPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return GetNetWordsForPeriod(stats, periodStart, periodEnd) / GetWritingTimeForPeriod(stats, periodStart, periodEnd);
    }

    export function GetWAPMA(stats: WSFileStat[]) {
        return GetWordsAdded(stats) / GetWritingTime(stats);
    }

    export function GetWAPMAPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        return GetWordsAddedForPeriod(stats, periodStart, periodEnd) / GetWritingTimeForPeriod(stats, periodStart, periodEnd);
    }
}

export class WordStatsManager {
    constructor(
        public plugin: WordStatisticsPlugin,
        public stats: WSFileStat[] = [],
        public map: Map<WSFile, WSFileStat[]> = new Map<WSFile, WSFileStat[]>(),
    ){}

    get first(): WSFileStat {
        return this.stats.first();
    }

    get last(): WSFileStat {
        return this.stats.last();
    }

    extendStats(newStats: WSFileStat[]) {
        for (let stat of newStats) {
            //console.log(stat, "discard=", this.stats.contains(stat));
            if (this.stats.contains(stat)) continue;
            this.stats.push(stat);
            let group: WSFileStat[] = this.map.get(stat.file) || [];
            group.push(stat);
            group.sort((a, b) => a.startTime - b.startTime);
            this.map.set(stat.file, group);
        }
        this.stats.sort((a, b) => a.startTime - b.startTime);
    }

    getStatsForDate(start: DateTime, end?: DateTime): WSFileStat[] {
        let stats = this.stats.filter((stat) => {
            return stat.startTime >= start.toMillis() && stat.endTime <= (end?.toMillis() || start.toMillis() + Settings.Statistics.DAY_LENGTH);
        });
        return stats;
    }

    getFilesFromStats(stats: WSFileStat[]): WSFile[] {
        let files: Set<WSFile> = new Set<WSFile>();
        for (let stat of this.stats) {
            files.add(stat.file);
        }
        return Array.from(files).sort((a, b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true }));
    }

    getStatsForFile(file: WSFile): WSFileStat[] {
        return this.map.get(file) || [];
    }

    getStatsForFileForDate(file: WSFile, start: DateTime, end?: DateTime): WSFileStat[] {
        let stats = this.stats.filter((stat) => {
            return stat.file === file && stat.startTime >= start.toMillis() && stat.endTime <= (end?.toMillis() || start.toMillis() + Settings.Statistics.DAY_LENGTH);
        })
        return stats;
    }
}