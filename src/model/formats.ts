import { DateTime, Duration } from "luxon";
import type WordStatisticsPlugin from "src/main";
import type { WSDataCollector } from "./collector";
import { WSFile } from "./file";
import { WSPath } from "./path";
import { WSFileProject, WSFolderProject, WSProject, WSPType, WSTagProject } from "./project";
import { WSStatisticsManager, WSTimePeriod, type IFileStat, type IFileWrapper } from "./statistics";

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
        let table: IFile[];
        let files: WSFile[] = [];
        try {
            table = JSON.parse(data) as IFile[];
            files = DeserializeFiles(table);
        } catch (error) {
            console.log(`Error attempting to parse file data [${data}]: `, error);
        }
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
        wordGoalForFiles: number,
        iconID: string,
        monitorCounts: boolean;
    }

    function SerializeProjects(projects: WSProject[]): IProject[] {
        let table: IProject[] = [];
        projects.forEach((p) => {
            table.push({ id: p.id, path: p.path, pType: p.pType, title: p._title, category: p.category, index: p.index, wordGoalForProject: p.wordGoalForProject, wordGoalForFiles: p.wordGoalForFiles, iconID: p.iconID, monitorCounts: p.monitorCounts });
        });
        return table;
    }

    function BuildProject(collector: WSDataCollector, data: IProject): WSProject {
        let { id, path, pType, title, category, index, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts } = data;
        switch (pType) {
            case WSPType.File:
                let file = collector.getFileSafer(index);
                if (file != null) {
                    return new WSFileProject(collector, id, path, file, category, title, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts);
                }
                console.log(`Attempted to load project from invalid data. File not found for '${index}':`, data);
                break;
            case WSPType.Folder:
                if (collector.getAllFolders().contains(index)) {
                    return new WSFolderProject(collector, id, path, index, category, title, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts);
                }
                console.log(`Attempted to load project from invalid data. Folder not found for '${index}':`, data);
                break;
            case WSPType.Tag:
                if (collector.getAllTags().contains(index)) {
                    return new WSTagProject(collector, id, path, index, category, title, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts);
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
        let table: IProject[];
        let projects: WSProject[] = [];
        try {
            table = JSON.parse(data) as IProject[];
            projects = DeserializeProjects(collector, table);
        } catch (error) {
            console.log(`Error attempting to parse project data [${data}]: `, error);
        }
        // console.log("Project data loaded.");
        return projects;
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
        wordGoalForPath: number,
        wordGoalForProjects: number,
        wordGoalForFiles: number,
        iconID: string;
    }

    function SerializePaths(paths: WSPath[]): IPath[] {
        let table: IPath[] = [];
        paths.forEach((p) => {
            table.push({ path: p.path, title: p._title, wordGoalForPath: p.wordGoalForPath, wordGoalForProjects: p.wordGoalForProjects, wordGoalForFiles: p.wordGoalForFiles, iconID: p.iconID });
        });
        return table;
    }

    function DeserializePaths(table: IPath[]): WSPath[] {
        let paths: WSPath[] = [];
        table.forEach((row) => {
            let { path, title, wordGoalForPath, wordGoalForProjects, wordGoalForFiles, iconID } = row;
            let pathObj = new WSPath(path, title, wordGoalForPath, wordGoalForProjects, wordGoalForFiles, iconID);
            if (pathObj instanceof WSPath) {
                paths.push(pathObj);
            } else {
                console.log("Failed to deserialize path: ", row);
            }
        });
        return paths;
    }

    export function LoadPathData(data: string): WSPath[] {
        let table: IPath[];
        let paths: WSPath[] = [];
        try {
            table = JSON.parse(data) as IPath[];
            paths = DeserializePaths(table);
        } catch (error) {
            console.log(`Error attempting to parse path data [${data}]: `, error);
        }
        // console.log("Path data loaded.");
        return paths;
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

    interface IFileWrapperExport {
        file: string,
        stats: IFileStat;
    }

    interface ITimePeriod {
        timeStart: number,
        timeEnd: number,
        expiry: number,
        files: IFileWrapperExport[],
        base: number,
        wordsStart: number,
        wordsEnd: number,
        wordsAdded: number,
        wordsDeleted: number,
        wordsImported: number,
        wordsExported: number,
        wordsUpdatedAt: number,
        writingTime: number,
    }

    function ExportFileWrapper(incoming: IFileWrapper): IFileWrapperExport {
        return { file: incoming.file.path, stats: incoming.stats };
    }

    function ImportFileWrapper(collector: WSDataCollector, incoming: IFileWrapperExport): IFileWrapper {
        let file = collector.getFileSafer(incoming.file);

        if (file != null) {
            return { file, stats: incoming.stats };
        }
        console.log(`Attempted to load statistics from invalid data. File not found for '${incoming.file}':`, incoming);
    }

    function SerializeStatisticalData(stats: WSTimePeriod[]) {
        let table: ITimePeriod[] = [];
        stats.forEach((period) => {
            let newFiles: IFileWrapperExport[] = [];
            period.files.forEach((wrapper) => {
                newFiles.push(ExportFileWrapper(wrapper));
            });
            table.push({
                timeStart: period.timeStart,
                timeEnd: period.timeEnd,
                expiry: period.expiry,
                files: newFiles,
                base: period.base,
                wordsStart: period.wordsStart,
                wordsEnd: period.wordsEnd,
                wordsAdded: period.wordsAdded,
                wordsDeleted: period.wordsDeleted,
                wordsImported: period.wordsImported,
                wordsExported: period.wordsExported,
                wordsUpdatedAt: period.wordsUpdatedAt,
                writingTime: period.writingTime
            });
        });
        return table;
    }

    function DeserializeStatisticalData(collector: WSDataCollector, manager: WSStatisticsManager, table: ITimePeriod[]): WSTimePeriod[] {
        let stats: WSTimePeriod[] = [];
        table.forEach((row) => {
            let { timeStart, timeEnd, expiry, files, base, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, wordsUpdatedAt, writingTime } = row;
            let newFiles: IFileWrapper[] = [];
            files.forEach(eWrapper => {
                newFiles.push(ImportFileWrapper(collector, eWrapper));
            });
            stats.push(new WSTimePeriod(manager, timeStart, timeEnd, expiry, newFiles, base, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, wordsUpdatedAt, writingTime));
        });
        return stats;
    }

    export function LoadStatisticalData(collector: WSDataCollector, manager: WSStatisticsManager, data: string): WSTimePeriod[] {
        let table: ITimePeriod[] = [];
        let stats: WSTimePeriod[] = [];
        try {
            table = JSON.parse(data) as ITimePeriod[];
            stats = DeserializeStatisticalData(collector, manager, table);
        } catch (error) {
            console.log(`Error attempting to parse statistics data [${data}]: `, error);
        }
        return stats;
    }

    export function SaveStatisticalData(plugin: WordStatisticsPlugin, stats: WSTimePeriod[]): string {
        let table = SerializeStatisticalData(stats);
        let data: string;
        if (plugin.settings.databaseSettings.statisticsMinify) {
            data = JSON.stringify(table);
        } else {
            data = JSON.stringify(table, null, 2);
        }
        return data;
    }

    export function StatisticDataToCSV(plugin: WordStatisticsPlugin, stats: WSTimePeriod[]): string {
        let csv: string[] = [];
        let header = "Timestamp,LocalDate,LocalTime,Duration,EndDate,EndTime,UpdateTimestamp,Path,Project,File,WordsStart,WordsEnd,WordsAdded,WordsDeleted,WordsImported,WordsExported,WritingTime";
        csv.push(header);
        stats.forEach(period => {
            period.files.forEach(wrapper => {
                let info = wrapper.stats;
                let timestamp = info.timeStart.toString();
                let localTime = DateTime.fromMillis(info.timeStart);
                let endTime = DateTime.fromMillis(info.timeEnd);
                let localDateStr = localTime.toFormat('yyyy-LL-dd');
                let localTimeStr = localTime.toFormat('HH:mm:ss');
                let endDateStr = localTime.toFormat('yyyy-LL-dd');
                let endTimeStr = localTime.toFormat('HH:mm:ss');
                let duration = (info.timeEnd - info.timeStart).toString();
                let updateTimestamp = info.wordsUpdatedAt.toString();
                let file = wrapper.file.path;
                let projects = plugin.collector.manager.getProjectsByFile(wrapper.file);
                let wordsStart = info.wordsStart.toString();
                let wordsEnd = info.wordsEnd.toString();
                let wordsAdded = info.wordsAdded.toString();
                let wordsDeleted = info.wordsDeleted.toString();
                let wordsImported = info.wordsImported.toString();
                let wordsExported = info.wordsExported.toString();
                let writingTime = info.writingTime.toString();
                if (projects.length > 0) {
                    projects.forEach(project => {
                        let row = [timestamp, localDateStr, localTimeStr, duration, endDateStr, endTimeStr, updateTimestamp, project.path, project.id, file, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, writingTime];
                        csv.push(row.join(","));    
                    })
                } else {
                    let row = [timestamp, localDateStr, localTimeStr, duration, endDateStr, endTimeStr, updateTimestamp, "", "", file, wordsStart, wordsEnd, wordsAdded, wordsDeleted, wordsImported, wordsExported, writingTime];
                    csv.push(row.join(","));
                }
            })
        })
        return csv.join("\n");
    }

}