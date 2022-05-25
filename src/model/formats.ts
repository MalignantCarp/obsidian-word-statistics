import type WordStatisticsPlugin from "src/main";
import type { WSDataCollector } from "./collector";
import { WSFile } from "./file";
import { WSPath } from "./path";
import { WSFileProject, WSFolderProject, WSProject, WSPType, WSTagProject } from "./project";

export namespace WSFormat {

    interface IFile {
        name: string,
        path: string,
        words: number,
        wordGoalForFile: number,
        lastUpdate: number;
    }

    function SerializeFiles(files: WSFile[]): IFile[] {
        let table: IFile[] = [];
        files.forEach((f) => {
            table.push({ name: f.name, path: f.path, words: f.words, wordGoalForFile: f.wordGoal, lastUpdate: f.lastUpdate });
        });
        return table;
    }

    function DeserializeFiles(table: IFile[]): WSFile[] {
        let files: WSFile[] = [];
        table.forEach((row) => {
            let file = new WSFile(row.name, row.path, row.wordGoalForFile);
            if (file instanceof WSFile) {
                file.words = row.words;
                file.lastUpdate = row.lastUpdate;
                files.push(file);
            } else {
                console.log("Failed to deserialize file: ", row);
            }
        });
        return files;
    }

    export function LoadFileData(data: string): WSFile[] {
        // console.log("Loading file data.");
        let table = JSON.parse(data) as IFile[];
        let files = DeserializeFiles(table);
        // console.log("File data loaded.");
        return files;
    }

    export function SaveFileData(plugin: WordStatisticsPlugin, files: WSFile[]): string {
        let table = SerializeFiles(files);
        let data: string;
        if (plugin.settings.databaseSettings.fileMinify) {
            data = JSON.stringify(table);
        } else {
            data = JSON.stringify(table, null, 2);
        }
        return data;
    }

    interface IProject {
        id: string,
        path: string,
        pType: number,
        title: string,
        category: number,
        index: string,
        wordGoalForProject: number,
        wordGoalForFiles: number;
    }

    function SerializeProjects(projects: WSProject[]): IProject[] {
        let table: IProject[] = [];
        projects.forEach((p) => {
            table.push({ id: p.id, path: p.path, pType: p.pType, title: p._title, category: p.category, index: p.index, wordGoalForProject: p.wordGoalForProject, wordGoalForFiles: p.wordGoalForFiles });
        });
        return table;
    }

    function BuildProject(collector: WSDataCollector, data: IProject): WSProject {
        let { id, path, pType, title, category, index, wordGoalForProject, wordGoalForFiles } = data;
        switch (pType) {
            case WSPType.File:
                let file = collector.getFileSafer(index);
                if (file != null) {
                    return new WSFileProject(collector, id, path, file, category, title, wordGoalForProject, wordGoalForFiles);
                }
                console.log(`Attempted to load project from invalid data. File not found for '${index}':`, data);
                break;
            case WSPType.Folder:
                if (collector.getAllFolders().contains(index)) {
                    return new WSFolderProject(collector, id, path, index, category, title, wordGoalForProject, wordGoalForFiles);
                }
                console.log(`Attempted to load project from invalid data. Folder not found for '${index}':`, data);
                break;
            case WSPType.Tag:
                if (collector.getAllTags().contains(index)) {
                    return new WSTagProject(collector, id, path, index, category, title, wordGoalForProject, wordGoalForFiles);
                }
                console.log(`Attempted to load project from invalid data. Tag not found for '${index}':`, data);
                break;
            default:
                console.log(`Attempted to load project from invalid data. Unknown project type '${pType}':`, data);
                break;
        }
        return null;

    }

    function DeserializeProjects(collector: WSDataCollector, table: IProject[]): WSProject[] {
        let projects: WSProject[] = [];
        table.forEach((row) => {
            let project = BuildProject(collector, row);
            if (project instanceof WSProject) {
                projects.push(project);
            } else {
                console.log("Failed to deserialize project: ", row);
            }
        });
        return projects;
    }

    export function LoadProjectData(collector: WSDataCollector, data: string): WSProject[] {
        let table = JSON.parse(data) as IProject[];
        return DeserializeProjects(collector, table);
    }

    export function SaveProjectData(plugin: WordStatisticsPlugin, projects: WSProject[]): string {
        let table = SerializeProjects(projects);
        let data: string;
        if (plugin.settings.databaseSettings.projectMinify) {
            data = JSON.stringify(table);
        } else {
            data = JSON.stringify(table, null, 2);
        }
        return data;
    }

    interface IPath {
        path: string,
        title: string,
        category: number,
        wordGoalForPath: number,
        wordGoalForProjects: number,
        wordGoalForFiles: number,
        iconID: string;
    }

    function SerializePaths(paths: WSPath[]): IPath[] {
        let table: IPath[] = [];
        paths.forEach((p) => {
            table.push({ path: p.path, title: p._title, category: p.category, wordGoalForPath: p.wordGoalForPath, wordGoalForProjects: p.wordGoalForProjects, wordGoalForFiles: p.wordGoalForFiles, iconID: p.iconID });
        });
        return table;
    }

    function DeserializePaths(table: IPath[]): WSPath[] {
        let paths: WSPath[] = [];
        table.forEach((row) => {
            let { path, title, category, wordGoalForPath, wordGoalForProjects, wordGoalForFiles, iconID } = row;
            let pathObj = new WSPath(path, title, category, wordGoalForPath, wordGoalForProjects, wordGoalForFiles, iconID);
            if (pathObj instanceof WSPath) {
                paths.push(pathObj);
            } else {
                console.log("Failed to deserialize path: ", row);
            }
        });
        return paths;
    }

    export function LoadPathData(data: string): WSPath[] {
        let table = JSON.parse(data) as IPath[];
        return DeserializePaths(table);
    }

    export function SavePathData(plugin: WordStatisticsPlugin, paths: WSPath[]): string {
        let table = SerializePaths(paths);
        let data: string;
        if (plugin.settings.databaseSettings.pathMinify) {
            data = JSON.stringify(table);
        } else {
            data = JSON.stringify(table, null, 2);
        }
        return data;
    }

}