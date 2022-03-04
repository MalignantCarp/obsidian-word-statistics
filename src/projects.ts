import { timeStamp } from "console";
import { WSDataCollector } from "./data";
import { WSFileRef } from "./files";
import WordStatisticsPlugin from "./main";

interface WSProjectData {
    displayText: string,
    wordsExcluded: boolean,
}

export class WSProjectManager {
    private plugin: WordStatisticsPlugin;
    private collector: WSDataCollector;
    private projects: Map<string, WSProject>;

    constructor(plugin: WordStatisticsPlugin, collector: WSDataCollector) {
        this.plugin = plugin;
        this.collector = collector;
        this.projects = new Map<string,WSProject>();
    }

    projectNameExists(name: string) {
        return this.projects.has(name);
    }

    // unless we're using some kind of ID system, there's no real way for this to be useful
    // if you change the name of the project, then it will no longer trigger in all of the links
    // and there will instead be project files linked to an invalid project, which I suppose
    // could then be listed in the project leaf;
    // we don't want the project to be manipulating any files, so changing the YAML tags for a file
    // doesn't seem like a good plan
    renameProject(project: WSProject, name:string) {
        let oldName = project.getName();
        project.setName(name);
        this.projects.delete(oldName);
        this.projects.set(name, project);
    }

    getProject(name: string) {
        if (!this.projects.has(name)) {
            return null;
        }
        return this.projects.get(name);
    }

    newProject(name: string) {
        if (this.projects.has(name)) {
            return null;
        }
        let project = new WSProject(name);
        this.projects.set(name, project);
        return project;
    }

    deleteProject(name: string) {
        if (!this.projects.has(name)) {
            console.log("Tried to delete project '%s' but it does not exist.", name);
        } else {
            this.projects.get(name).cleanup();
            this.projects.delete(name);
        }
    }

    getProjectList() {
        return (Array.from(this.projects.values()));
    }

    getProjectNames() {
        return (Array.from(this.projects.keys()));
    }

    getProjectsCount() {
        return this.projects.size;
    }

    cleanup() {
        for (const [, project] of this.projects) {
            project.cleanup();
        }
        this.projects.clear();
    }
}

export class WSProject {
    private name: string;
    private files: Map<WSFileRef, WSProjectData>;

    constructor(name: string) {
        this.name = name;
        this.files = new Map<WSFileRef, WSProjectData>();
    }

    cleanup() {
        this.files.clear();
    }

    getName() {
        return this.name;
    }

    setName(name: string) {
        this.name = name;
    }

    addFile(file: WSFileRef, name: string, excluded: boolean) {
        if (!this.files.has(file)) {
            this.files.set(file, { displayText: name, wordsExcluded: excluded });
        } else {
            console.log("Tried to add WSFileRef(%d)[%s] to project '%s', but it was already in file list.", file.getID(), file.getPath(), this.name);
        }
    }

    hasFile(file: WSFileRef) {
        return (this.files.has(file));
    }

    deleteFile(file: WSFileRef) {
        if (this.files.has(file)) {
            this.files.delete(file);
        } else {
            console.log("Tried to remove WSFileRef(%d)[%s] from project '%s', but it was not there.", file.getID(), file.getPath(), this.name);
        }
    }

    getFilesTuple() {
        let files: [WSFileRef, WSProjectData][] = [];
        let fileList = Array.from(this.files.keys());
        for (let i = 0; i < fileList.length; i++) {
            files.push([fileList[i], this.files.get(fileList[i])]);
        }
        return files;
    }

}
