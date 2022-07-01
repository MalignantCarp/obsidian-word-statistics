import type { WSFile } from "./file";

export interface IFileStat {
    file: WSFile,
    timestamp: number,
    wordCount: number
}

export class StatisticsManager {
    constructor() {

    }
}