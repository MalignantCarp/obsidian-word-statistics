import type { DateTime } from "luxon";
import type WordStatisticsPlugin from "src/main";
import { Settings } from "src/settings";
import type { WSFileStat, WSFile } from "./file";

export class WordStatsManager {
    constructor(
        public plugin: WordStatisticsPlugin,
        public stats: WSFileStat[] = [],
        public map: Map<WSFile, WSFileStat[]> = new Map<WSFile, WSFileStat[]>(),
    ){}

    extendStats(newStats: WSFileStat[]) {
        for (let stat of newStats) {
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