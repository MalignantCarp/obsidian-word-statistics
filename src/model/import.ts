import type WordStatisticsPlugin from "src/main";
import type { EFileStat, EFile, EFolder } from "./export";
import { WSFile, WSFileStat } from "./file";
import { WSFolder } from "./folder";

function BuildFileStats(file: WSFile, stats: EFileStat[]): WSFileStat[] {
    let fileStats: WSFileStat[] = [];
    for (let stat of stats) {
        fileStats.push(new WSFileStat(file, stat.startTime, stat.startWords, stat.endTime, stat.endWords, stat.wordsAdded, stat.wordsDeleted, stat.wordsImported, stat.wordsExported, stat.writingTime));
    }
    return fileStats;
}

function BuildChildFiles(plugin: WordStatisticsPlugin, fileMap: Map<string, WSFile>, folderMap: Map<string, WSFolder>, parent: WSFolder, children: EFile[]): WSFile[] {
    let childFiles: WSFile[] = [];
    for (let child of children) {
        let fileRef = new WSFile(plugin, parent, child.path, child.name, child.title, child.wordCount, child.wordGoal, child.title != "", child.wordGoal > 0);
        fileRef.stats = BuildFileStats(fileRef, child.stats);
        childFiles.push(fileRef);
        fileMap.set(child.path, fileRef);
    }
    return childFiles;
}

function BuildChildFolders(plugin: WordStatisticsPlugin, fileMap: Map<string, WSFile>, folderMap: Map<string, WSFolder>, parent: WSFolder, children: EFolder[]): WSFolder[] {
    let childFolders: WSFolder[] = [];
    for (let child of children) {
        let newFolder = new WSFolder(plugin, parent, child.path, child.name, child.title, child.wordCount, child.wordGoalForFiles, child.wordGoalForFolders, child.wordGoal, child.recording);
        folderMap.set(newFolder.path, newFolder);
        newFolder.children = BuildChildFiles(plugin, fileMap, folderMap, newFolder, child.children);
        newFolder.childFolders = BuildChildFolders(plugin, fileMap, folderMap, newFolder, child.childFolders);
        childFolders.push(newFolder);
    }
    return childFolders;
}

function BuildTreeFromImport(plugin: WordStatisticsPlugin, folderRoot: EFolder): [WSFolder, Map<string, WSFolder>, Map<string, WSFile>] {
    let fileMap = new Map<string, WSFile>();
    let folderMap = new Map<string, WSFolder>();
    let root = new WSFolder(plugin, null, folderRoot.path, folderRoot.name, folderRoot.title, folderRoot.wordCount, folderRoot.wordGoalForFiles, folderRoot.wordGoalForFolders, folderRoot.wordGoal, folderRoot.recording);
    folderMap.set(root.path, root);
    root.children = BuildChildFiles(plugin, fileMap, folderMap, root, folderRoot.children);
    root.childFolders = BuildChildFolders(plugin, fileMap, folderMap, root, folderRoot.childFolders);
    return [root, folderMap, fileMap];
}

export function ImportTree(plugin: WordStatisticsPlugin, folderData: string): [WSFolder, Map<string, WSFolder>, Map<string, WSFile>, string]{
    let folderRoot: EFolder;
    let files: EFile[];
    if (!folderData.trim()) {
        console.log("Folder data file is empty.");
        return [null, null, null, "Folder data file exists but is empty."];
    }
    try {
        folderRoot = JSON.parse(folderData) as EFolder;
    } catch (error) {
        console.log("Error deserializing data: ", folderData);
        console.log(error);
        console.log("Aborting import.");
        return [null, null, null, "Database exists but cannot be imported due to parsing error."];
    }
    let startTime = Date.now();
    let [root, folderMap, fileMap] = BuildTreeFromImport(plugin, folderRoot);
    let endTime = Date.now();
    // console.log(`Imported folder and file tree in ${endTime - startTime}ms`);
    return [root, folderMap, fileMap, ""];
}