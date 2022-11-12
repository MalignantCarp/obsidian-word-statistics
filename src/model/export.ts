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
        if (!folder.isEmpty()) {
            childFolders.push({ path: folder.path, name: folder.name, title: folder.title, wordCount: folder.wordCount, wordGoalForFiles: folder.wordGoalForFiles, wordGoalForFolders: folder.wordGoalForFolders, wordGoal: folder.wordGoal, recording: folder.recording, children: BuildChildFiles(folder.children), childFolders: BuildChildFolders(folder.childFolders) });
        }
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
    for (let stat of plugin.manager.stats.stats) {
        let timestamp = stat.startTime.toString();
        let localTime = DateTime.fromMillis(stat.startTime);
        let endTime = DateTime.fromMillis(stat.endTime);
        let localDateStr = localTime.toFormat('yyyy-LL-dd');
        let localTimeStr = localTime.toFormat('HH:mm:ss');
        let endDateStr = endTime.toFormat('yyyy-LL-dd');
        let endTimeStr = endTime.toFormat('HH:mm:ss');
        let duration = (stat.duration).toString();
        let path = stat.file.parent.path;
        let file = stat.file.name;
        let wordsStart = stat.startWords.toString();
        let wordsEnd = stat.endWords.toString();
        let wordsAdded = stat.wordsAdded.toString();
        let wordsDeleted = stat.wordsDeleted.toString();
        let wordsImported = stat.wordsImported.toString();
        let wordsExported = stat.wordsExported.toString();
        let writingTime = stat.writingTime.toString();
        let row = [timestamp, localDateStr, localTimeStr, duration, endDateStr, endTimeStr, path, file, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, writingTime];
        csv.push(row.join(","));
    }
    return csv.join("\n");
}

export function StatisticsDataToCSVFolder(plugin: WordStatisticsPlugin): string {
    let csv: string[] = [];
    let header = "Timestamp,LocalDate,LocalTime,Duration,EndDate,EndTime,Path,Folder,Title,WordsStart,WordsEnd,WordsAdded,WordsDeleted,WordsImported,WordsExported,WritingTime";
    csv.push(header);
    let startTime = Date.now();
    let folders = Array.from(plugin.manager.folderMap.values()).sort((a, b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true }));
    if (plugin.settings.debug.showFolderExportTime) console.log(`Collected folders for stats export in ${Date.now() - startTime} ms.`);
    for (let folder of folders) {
        let localStart = Date.now();
        let stats = plugin.manager.stats.getStatsForFolderMerged(folder);
        for (let stat of stats) {
            let timestamp = stat.startTime.toString();
            let localTime = DateTime.fromMillis(stat.startTime);
            let endTime = DateTime.fromMillis(stat.endTime);
            let localDateStr = localTime.toFormat('yyyy-LL-dd');
            let localTimeStr = localTime.toFormat('HH:mm:ss');
            let endDateStr = endTime.toFormat('yyyy-LL-dd');
            let endTimeStr = endTime.toFormat('HH:mm:ss');
            let duration = (stat.duration).toString();
            let path = folder.path;
            let name = folder.name;
            let title = folder.title;
            let wordsStart = stat.startWords.toString();
            let wordsEnd = stat.endWords.toString();
            let wordsAdded = stat.wordsAdded.toString();
            let wordsDeleted = stat.wordsDeleted.toString();
            let wordsImported = stat.wordsImported.toString();
            let wordsExported = stat.wordsExported.toString();
            let writingTime = stat.writingTime.toString();
            let row = [timestamp, localDateStr, localTimeStr, duration, endDateStr, endTimeStr, path, name, title, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, writingTime];
            csv.push(row.join(","));
        }
        if (plugin.settings.debug.showFolderExportTime) console.log(`Built stats for ${folder.path} in ${Date.now() - localStart}ms`);
    }
    if (plugin.settings.debug.showFolderExportTime) console.log(`Built all stats in ${Date.now() - startTime}ms.`);
    return csv.join("\n");
}