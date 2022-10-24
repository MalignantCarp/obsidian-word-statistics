import { DateTime } from "luxon";
import type WordStatisticsPlugin from "src/main";
import type { WSFile, WSFileStat } from "./file";
import type { RECORDING, WSFolder } from "./folder";

export interface EFolder {
    path: string,
    name: string,
    title: string,
    wordCount: number,
    wordGoal: number,
    wordGoalForFiles: number,
    wordGoalForFolders: number,
    recording: RECORDING,
    children: EFile[],
    childFolders: EFolder[];
}

export interface EFile {
    parent: string,
    path: string,
    name: string,
    basename: string,
    title: string,
    wordCount: number,
    wordGoal: number,
    stats: EFileStat[];
}

export interface EFileStat {
    startTime: number,
    startWords: number,
    endTime: number,
    endWords: number,
    wordsAdded: number,
    wordsDeleted: number,
    wordsImported: number,
    wordsExported: number,
    writingTime: number,
}

function BuildFileStats(stats: WSFileStat[]): EFileStat[] {
    let fileStats: EFileStat[] = [];
    for (let stat of stats) {
        fileStats.push({ startTime: stat.startTime, startWords: stat.startWords, endTime: stat.endTime, endWords: stat.endWords, wordsAdded: stat.wordsAdded, wordsDeleted: stat.wordsDeleted, wordsImported: stat.wordsImported, wordsExported: stat.wordsExported, writingTime: stat.writingTime });
    }
    return fileStats;
}

function BuildChildFiles(children: WSFile[]): EFile[] {
    let childFiles: EFile[] = [];
    for (let child of children) {
        childFiles.push({ parent: child.parent.path, path: child.path, name: child.name, basename: child.basename, title: child.title, wordCount: child.wordCount, wordGoal: child.wordGoal, stats: BuildFileStats(child.stats) });
    }
    return childFiles;
}

function BuildChildFolders(folders: WSFolder[]): EFolder[] {
    let childFolders: EFolder[] = [];
    for (let folder of folders) {
        childFolders.push({ path: folder.path, name: folder.name, title: folder.title, wordCount: folder.wordCount, wordGoalForFiles: folder.wordGoalForFiles, wordGoalForFolders: folder.wordGoalForFolders, wordGoal: folder.wordGoal, recording: folder.recording, children: BuildChildFiles(folder.children), childFolders: BuildChildFolders(folder.childFolders) });
    }
    return childFolders;
}

export function BuildRootJSON(plugin: WordStatisticsPlugin, root: WSFolder): string {
    let startTime = Date.now();
    let folders = { path: root.path, name: root.name, title: root.title, wordCount: root.wordCount, wordGoalForFiles: root.wordGoalForFiles, wordGoalForFolders: root.wordGoalForFolders, wordGoal: root.wordGoal, recording: root.recording, children: BuildChildFiles(root.children), childFolders: BuildChildFolders(root.childFolders) };
    let endTime = Date.now();
    // console.log(`Built folders for export in ${endTime - startTime}ms.`);
    startTime = Date.now();
    endTime = Date.now();
    // console.log(`Built ${files.length} file(s) for export in ${endTime - startTime}ms.`);
    let fileData: string;
    if (plugin.settings.database.fileMinify) {
        fileData = JSON.stringify(folders);
    } else {
        fileData = JSON.stringify(folders, null, 2);
    }

    return fileData;
}

export function StatisticDataToCSV(plugin: WordStatisticsPlugin): string {
    let csv: string[] = [];
    let header = "Timestamp,LocalDate,LocalTime,Duration,EndDate,EndTime,Path,File,WordsStart,WordsEnd,WordsAdded,WordsDeleted,WordsImported,WordsExported,WritingTime";
    csv.push(header);
    plugin.manager.stats.stats.forEach(info => {
        let timestamp = info.startTime.toString();
        let localTime = DateTime.fromMillis(info.startTime);
        let endTime = DateTime.fromMillis(info.endTime);
        let localDateStr = localTime.toFormat('yyyy-LL-dd');
        let localTimeStr = localTime.toFormat('HH:mm:ss');
        let endDateStr = endTime.toFormat('yyyy-LL-dd');
        let endTimeStr = endTime.toFormat('HH:mm:ss');
        let duration = (info.duration).toString();
        let path = info.file.parent.path;
        let file = info.file.name;
        let wordsStart = info.startWords.toString();
        let wordsEnd = info.endWords.toString();
        let wordsAdded = info.wordsAdded.toString();
        let wordsDeleted = info.wordsDeleted.toString();
        let wordsImported = info.wordsImported.toString();
        let wordsExported = info.wordsExported.toString();
        let writingTime = info.writingTime.toString();
        let row = [timestamp, localDateStr, localTimeStr, duration, endDateStr, endTimeStr, path, file, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, writingTime];
        csv.push(row.join(","));
    });
    return csv.join("\n");
}