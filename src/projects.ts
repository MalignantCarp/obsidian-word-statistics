import { WSDataCollector } from "./data";
import { WSFile } from "./files";
import WordStatisticsPlugin from "./main";

export enum WSPType {
    File = 0,
    Folder,
    Tag
}

const PROJECT_TYPE_STRING = ["WSFileProject", "WSFolderProject", "WSTagProject"];

/*

interface Project {
    name: string,
    readonly type: WSPType,
    index: string;
}

interface Group {
    name: string,
    projects: string[];
}

interface ProjectMap {
    fileProjects: Project[];
    folderProjects: Project[];
    tagProjects: Project[];
    projectGroups: Group[];
}

class WSProject {
    name: string;
    readonly type: WSPType;

    constructor(name: string, type: WSPType) {
        this.name = name;
        this.type = type;
    };

    serialize() {
        return { name: this.name, type: this.type, index: "" };
    }
}

export class WSFileProject extends WSProject {
    file: WSFile;

    constructor(name: string, file: WSFile) {
        super(name, WSPType.File);
        this.file = file;
    }

    override serialize() {
        return { name: this.name, type: this.type, index: this.file.path };
    }
}

export class WSFolderProject extends WSProject {
    folder: string;

    constructor(name: string, folder: string) {
        super(name, WSPType.Folder);
        this.folder = folder;
    }

    override serialize() {
        return { name: this.name, type: this.type, index: this.folder };
    }
}

export class WSTagProject extends WSProject {
    tag: string;
    override readonly type: WSPType = WSPType.Tag;

    constructor(name: string, tag: string) {
        super(name, WSPType.Tag);
        this.tag = tag;
    }

    override serialize() {
        return { name: this.name, type: this.type, index: this.tag };
    }
}


export class WSProjectGroup {
    name: string;
    projects: WSProject[];

    constructor(name: string, projects: WSProject[]) {
        this.name = name;
        this.projects = projects;
    };

    serialize() {
        let projList: string[] = [];
        this.projects.forEach((proj: WSProject) => {
            projList.push(proj.name);
        });
        return { name: this.name, projects: projList };
    }
}

*/

interface WSProject {
    name: string,
    readonly type: WSPType,
    index: string;
}

interface WSProjectGroup {
    name: string,
    projects: string[];
}

interface WSProjectMap {
    fileProjects: WSProject[];
    folderProjects: WSProject[];
    tagProjects: WSProject[];
    projectGroups: Map<string, WSProjectGroup>;
}


/*

A Longform project is basically a project group, but it's a special case. Keeping track of its history may be somewhat boggling, though.
I can always auto-generate them on startup, but it makes more sense to generate them once and then just keep track of them.

People who are using Longform are likely to use Obsidian for all of the writing process and aren't going to change files outside, hopefully.

*/

export class WSProjectManager {
    tagProjects: WSProject[] = [];
    fileProjects: WSProject[] = [];
    folderProjects: WSProject[] = [];
    projectGroups: Map<string, WSProjectGroup>;
    plugin: WordStatisticsPlugin = null;
    collector: WSDataCollector = null;
    projects: Map<string, [WSPType, WSProject]>;
    errorState: boolean = false;
    errorMessages: string[] = [];

    constructor(plugin: WordStatisticsPlugin, collector: WSDataCollector, wMap?: WSProjectMap) {
        this.plugin = plugin;
        this.collector = collector;
        this.projects = new Map<string, [WSPType, WSProject]>();
        this.projectGroups = new Map<string, WSProjectGroup>();
        if (wMap != undefined) {
            this.loadProjects(wMap.fileProjects);
            this.loadProjects(wMap.folderProjects);
            this.loadProjects(wMap.tagProjects);
            wMap.projectGroups.forEach((group) => {
                this.realizeProjectGroup(group);
            });
        }
    }

    checkProjectName(name: string) {
        return !this.projects.has(name);
    }

    getProject(name: string) {
        let [, proj] = this.projects.get(name);
        return proj;
    }

    getProjectsForGroup(name: string) {
        if (this.projectGroups.has(name)) {
            let projects: WSProject[] = [];
            this.projectGroups.get(name).projects.forEach((pName) => {
                let [, proj] = this.projects.get(name);
                if (proj != undefined && proj != null) {
                    projects.push(proj);
                }
            });
            return projects;
        }
        return undefined;
    }

    getIndexFile(proj: WSProject) {
        if (proj.type === WSPType.File) {
            return this.collector.getFile(proj.index);
        }
        return undefined;
    }

    getIndexTag(proj: WSProject) {
        if (proj.type === WSPType.Tag) {
            return proj.index;
        }
        return undefined;
    }

    getIndexFolder(proj: WSProject) {
        if (proj.type === WSPType.Folder) {
            return proj.index;
        }
        return undefined;
    }

    logError(msg: string) {
        this.errorState = true;
        this.errorMessages.push(msg);
        console.log("WordStatistics.ProjectManager[err]: " + msg);
    }

    registerProject(proj: WSProject) {
        if (this.projects.has(proj.name)) {
            console.log(this.projects, proj, proj.name);
            this.logError(`Tried to register project '${proj.name}', but one with that name already exists of type '${PROJECT_TYPE_STRING[proj.type]}'.`);
            throw Error();
        }
        this.projects.set(proj.name, [proj.type, proj]);
        switch (proj.type) {
            case WSPType.File:
                this.fileProjects.push(proj);
                break;
            case WSPType.Folder:
                this.folderProjects.push(proj);
                break;
            case WSPType.Tag:
                this.tagProjects.push(proj);
                break;
            default:
                console.log(proj);
                this.logError(`Invalid project type: ${proj.type} for project: ${proj}`);
        }
    }
    /*
        realizeProject(proj: Project) {
            if (proj.type === WSPType.File) {
                return (new WSFileProject(proj.name, this.collector.getFile(proj.index)));
            } else if (proj.type === WSPType.Folder) {
                return (new WSFolderProject(proj.name, proj.index));
            } else if (proj.type === WSPType.Tag) {
                return (new WSTagProject(proj.name, proj.index));
            } else {
                throw Error(`Invalid project type ${proj.type}`);
            }
        }
    */
    validateProjectLoad(projects: WSProject[]) {
        let names: string[] = [];
        projects.forEach((proj) => {
            if (names.contains(proj.name)) {
                console.log(`Project name already in use: ${proj.name}`);
                return false;
            }
            names.push(proj.name);
        });
        return true;
    }

    loadProjects(projects: WSProject[]) {
        if (this.validateProjectLoad(projects)) {
            projects.forEach((proj: WSProject) => {
                this.registerProject(proj);
            });
        }
    }

    realizeProjectGroup(group: WSProjectGroup) {
        if (this.projectGroups.has(group.name)) {
            console.log(this.projectGroups.get(group.name));
            this.logError(`Tried to realize project group '${group.name}' but a group already exists with that name.`);
            return;
        }

        let fail = false;
        group.projects.forEach((name: string) => {
            if (!this.projects.has(name)) {
                fail = true;
                this.logError(`Could not resolve project '${name}' for project group '${group.name}'.`);
            }
        });
        if (fail) {
            this.logError(`Failed to load project group '${group.name}'.`);
        } else {
            this.projectGroups.set(group.name, group);
        }
    }

    /*
        serialize(): ProjectMap {
            let fileProjects: Project[] = [];
            let folderProjects: Project[] = [];
            let tagProjects: Project[] = [];
            let projectGroups: Group[] = [];
    
            this.fileProjects.forEach((proj) => {
                fileProjects.push(proj.serialize());
            });
            this.folderProjects.forEach((proj) => {
                folderProjects.push(proj.serialize());
            });
            this.tagProjects.forEach((proj) => {
                tagProjects.push(proj.serialize());
            });
            this.projectGroups.forEach((grp) => {
                projectGroups.push(grp.serialize());
            });
            return { fileProjects, folderProjects, tagProjects, projectGroups };
        }
    */

    serialize(): WSProjectMap {
        return { fileProjects: this.fileProjects, folderProjects: this.folderProjects, tagProjects: this.tagProjects, projectGroups: this.projectGroups };
    }

}