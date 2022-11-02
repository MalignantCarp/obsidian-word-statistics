import type { DateTime } from "luxon";
import type WordStatisticsPlugin from "src/main";
import { Settings } from "src/settings";
import type { WSFileStat, WSFile } from "./file";
import type { WSFolder } from "./folder";

export class StatsPropagate {
    public startTime: number = 0;
    public endTime: number = 0;
    public duration: number = 0;
    public startWords: number = 0;
    public endWords: number = 0;
    public wordsAdded: number = 0;
    public wordsDeleted: number = 0;
    public wordsImported: number = 0;
    public wordsExported: number = 0;
    public netWords: number = 0;
    public writingTime: number = 0;
    public parent: WSFolder;

    propagateStart(startTime: number, startWords: number) {
        if (this.startTime === 0) {
            this.startTime = startTime;
            this.startWords = startWords;
        }
        if (this.parent?.isRecording) this.parent.propagateStart(startTime, startWords);
    }

    propagateEndTime(endTime: number) {
        this.endTime = Math.max(endTime, this.endTime);
        if (this.parent?.isRecording) this.parent.propagateEndTime(endTime);
    }

    propagateDuration(duration: number) {
        this.duration += duration;
        if (this.parent?.isRecording) this.parent.propagateDuration(duration);
    }

    propagateWordsAdded(words: number) {
        this.wordsAdded += words;
        this.endWords += words;
        this.netWords += words;
        if (this.parent?.isRecording) this.parent.propagateWordsAdded(words);
    }

    propagateWordsDeleted(words: number) {
        this.wordsDeleted += words;
        this.endWords -= words;
        this.netWords -= words;
        if (this.parent?.isRecording) this.parent.propagateWordsDeleted(words);
    }

    propagateWordsImported(words: number) {
        this.wordsImported += words;
        this.netWords += words;
        this.endWords += words;
        if (this.parent?.isRecording) this.parent.propagateWordsImported(words);
    }

    propagateWordsExported(words: number) {
        this.wordsExported += words;
        this.endWords -= words;
        this.netWords -= words;
        if (this.parent?.isRecording) this.parent.propagateWordsExported(words);
    }

    propagateWritingTime(writingTime: number) {
        this.writingTime += writingTime;
        if (this.parent?.isRecording) this.parent.propagateWritingTime(writingTime);
    }
}

export namespace WordStats {
    export function Sort(stats: WSFileStat[]) {
        let group = stats.sort((a, b) => a.startTime - b.startTime);
        return group;
    }

    export function SortForPeriod(stats: WSFileStat[], periodStart: number, periodEnd: number) {
        let group = stats.sort((a, b) => a.startTime - b.startTime).filter((stat) => { return stat.startTime >= periodStart && stat.endTime <= periodEnd; });
        return group;
    }

    export function GetStartTime(stats: WSFileStat[]) {
        return stats.first().startTime;
    }

    /**
     * @param stats - A collection of WSFileStat objects, presumably the collection of stats objects for all files within a folder, or all stats objects within a file.
     * 
     * @return The first startWords value that occurs within the collection of stats as sorted by startTime
     */
    export function GetStartWords(stats: WSFileStat[]) {
        return stats.first().startWords;
    }

    export function GetEndTime(stats: WSFileStat[]) {
        return stats.last().endTime;
    }

    /**
     * @param stats - A collection of WSFileStat objects, presumably the collection of stats objects for all files within a folder, or all stats objects within a file.
     * 
     * @return The sum of all endWords for the latest occurance of each file housed within the collection.
     */
     export function GetEndWords(stats: WSFileStat[]) {
        let files: WSFile[] = []
        for (let stat of stats) {
            if (!files.contains(stat.file)) {
                files.push(stat.file);
            }
        }
        let words = 0;
        for (let i = stats.length - 1; i >= 0; i--) {
            if (files.contains(stats[i].file)) {
                words += stats[i].endWords;
                files.remove(stats[i].file);
            }
            if (files.length === 0) break;
        }
        return words;
    }

    export function GetWordsAdded(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsAdded; }, 0);
    }

    export function GetWordsDeleted(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsDeleted; }, 0);
    }

    export function GetWordsImported(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsImported; }, 0);
    }

    export function GetWordsExported(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.wordsExported; }, 0);
    }

    export function GetWritingTime(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.writingTime; }, 0);
    }

    export function GetDuration(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.duration; }, 0);
    }

    export function GetNetWords(stats: WSFileStat[]) {
        return stats.reduce((total, stat) => { return total + stat.netWords; }, 0);
    }

    export function GetWPM(stats: WSFileStat[]) {
        return GetNetWords(stats) / (GetDuration(stats) / 60000);
    }

    export function GetWAPM(stats: WSFileStat[]) {
        return GetWordsAdded(stats) / (GetDuration(stats) / 60000);
    }

    export function GetWPMA(stats: WSFileStat[]) {
        return GetNetWords(stats) / (GetWritingTime(stats) / 60000);
    }

    export function GetWAPMA(stats: WSFileStat[]) {
        return GetWordsAdded(stats) / (GetWritingTime(stats) / 60000);
    }
}

export class WordStatsManager {
    constructor(
        public plugin: WordStatisticsPlugin,
        public stats: WSFileStat[] = [],
        public map: Map<WSFile, WSFileStat[]> = new Map<WSFile, WSFileStat[]>(),
    ) { }

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
        });
        return stats;
    }

    getStatsForFolder(folder: WSFolder): WSFileStat[] {
        let stats = this.stats.filter((stat) => {
            return folder.isAncestorOf(stat.file);
        });
        return stats;
    }

    getStatsForFolderForDate(folder: WSFolder, start: DateTime, end?: DateTime): WSFileStat[] {
        let stats = this.stats.filter((stat) => {
            return folder.isAncestorOf(stat.file) && stat.startTime >= start.toMillis() && stat.endTime <= (end?.toMillis() || start.toMillis() + Settings.Statistics.DAY_LENGTH);
        });
        return stats;
    }

}