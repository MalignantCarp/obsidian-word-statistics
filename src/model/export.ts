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
        childFiles.push({ parent: child.parent.path, path: child.path, name: child.name, title: child.title, wordCount: child.wordCount, wordGoal: child.wordGoal, stats: BuildFileStats(child.stats) });
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
    if (plugin.settings.databaseSettings.fileMinify) {
        fileData = JSON.stringify(folders);
    } else {
        fileData = JSON.stringify(folders, null, 2);
    }

    return fileData;
}
