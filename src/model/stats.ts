import type WordStatisticsPlugin from "src/main";
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
}