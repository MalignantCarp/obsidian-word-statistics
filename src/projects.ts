import { TFile } from "obsidian";
import { WSDataCollector } from "./data";
import { WSFileRef } from "./files";
import WordStatisticsPlugin from "./main";

interface WSProjectData {
    displayText: string,
    wordsExcluded: boolean,
}

enum WSPIndexType {
    File = 0, Folder, Tag
}

export interface WSProjectMap {
    name: string;
    type: WSPIndexType;
    index: string;
}

export class WSProjectManager {
    private plugin: WordStatisticsPlugin;
    private collector: WSDataCollector;
    private projects: Map<string, WSProject>;
    private indexFiles: Map<WSFileRef, WSProject>;

    constructor(plugin: WordStatisticsPlugin, collector: WSDataCollector) {
        this.plugin = plugin;
        this.collector = collector;
        this.projects = new Map<string, WSProject>();
        this.indexFiles = new Map<WSFileRef, WSProject>();
    }

    async buildProjects(projects: WSProjectMap[]) {
        projects.forEach((project: WSProjectMap) => {
            if (this.newProject(project) == null) {
                console.log("Unable to create project for ", project);
                throw (Error());
            }
        });
    }

    mapProjects() {
        let maps: WSProjectMap[] = [];
        for (const [name, project] of this.projects) {
            let map: WSProjectMap = {
                name: project.getName(),
                type: project.getIndexType(),
                index: project.getIndexString()
            };
            maps.push(map);
        }
        return maps;
    }

    isIndexFile(fi: WSFileRef) {
        return this.indexFiles.has(fi);
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
    renameProject(project: WSProject, name: string) {
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

    newProject(map: WSProjectMap) {
        if (this.projects.has(map.name)) {
            return null;
        }
        let project = new WSProject(this, this.collector, map);
        if (project.indexedByFile()) {
            this.indexFiles.set(project.getIndexFile(), project);
        }
        this.projects.set(map.name, project);
        return project;
    }

    updateProject(name: string, map: WSProjectMap) {
        let project = this.projects.get(name);
        let oldMap: WSProjectMap = {
            name: project.getName(),
            type: project.getIndexType(),
            index: project.getIndexString()
        };

        if (oldMap.type === WSPIndexType.File && map.type != WSPIndexType.File) {
            this.indexFiles.delete(project.getIndexFile());
        }
        let rebuild = project.update(map);
        if (oldMap.name != map.name) {
            this.renameProject(project, map.name);
        }
        if (rebuild) {
            project.buildIndex();
        }
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
    private manager: WSProjectManager;
    private collector: WSDataCollector;
    private files: Map<WSFileRef, WSProjectData>;
    private indexType: WSPIndexType;
    private indexFolder: string; // should we find a way to encapsulate folders?
    private indexFile: WSFileRef;
    private indexTag: string;

    constructor(manager: WSProjectManager, collector: WSDataCollector, map: WSProjectMap) {
        this.manager = manager;
        this.collector = collector;
        this.name = map.name;
        this.indexType = map.type;
        this.indexFolder = null;
        this.indexFile = null;
        this.indexTag = null;
        this.files = new Map<WSFileRef, WSProjectData>();
        if (this.update(map)) {
            this.buildIndex();
        }
    }

    buildIndex() {
        this.cleanup();
        if (this.indexedByFile()) {
            let fileRef = this.indexFile;
            if (fileRef === null) {
                console.log("Invalid index file ('%s') for project ('%s')", this.indexFile, this.name, this);
                throw (Error("Invalid file index passed for project."));
            }

        }
    }

    update(map: WSProjectMap) {
        let rebuild = (this.indexType != map.type) || (this.indexType === map.type && this.getIndexString() != map.index);
        if (map.type === WSPIndexType.File) {
            this.indexFile = this.collector.getFile(map.index);
        } else if (map.type === WSPIndexType.Folder) {
            this.indexFolder = map.index;
        } else if (map.type === WSPIndexType.Tag) {
            this.indexTag = map.index;
        }
        return rebuild;
    }

    indexedByFolder() {
        return this.indexType === WSPIndexType.Folder;
    }

    indexedByFile() {
        return this.indexType === WSPIndexType.File;
    }

    indexedByTag() {
        return this.indexType === WSPIndexType.Tag;
    }

    setIndexFile(file: WSFileRef) {
        this.indexType = WSPIndexType.File;
        this.indexFile = file;
        this.indexFolder = null;
        this.indexTag = null;
    }

    setIndexFolder(path: string) {
        this.indexType = WSPIndexType.Folder;
        this.indexFile = null;
        this.indexFolder = path;
        this.indexTag = null;
    }

    setIndexTag(tag: string) {
        this.indexType = WSPIndexType.Tag;
        this.indexFile = null;
        this.indexFolder = null;
        this.indexTag = tag;
    }

    getIndexFile() {
        return this.indexType === WSPIndexType.File ? this.indexFile : null;
    }

    getIndexFolder() {
        return this.indexType === WSPIndexType.Folder ? this.indexFolder : null;
    }

    getIndexTag() {
        return this.indexType === WSPIndexType.Tag ? this.indexTag : null;
    }

    getIndexString() {
        if (this.indexedByFile()) {
            return (this.indexFile != null && this.indexFile != undefined) ? this.indexFile.getPath() : null;
        } else if (this.indexedByFolder()) {
            return this.indexFolder;
        } else if (this.indexedByTag()) {
            return this.indexTag;
        }
    }

    getIndexType() {
        return this.indexType;
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
