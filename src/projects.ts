import { WSDataCollector } from "./data";
import { WSFile } from "./files";
import WordStatisticsPlugin from "./main";

export enum WSPType {
    Null = 0,
    File,
    Folder,
    Tag
}

export const PROJECT_TYPE_STRING = ["WSProject", "WSFileProject", "WSFolderProject", "WSTagProject"];
export const PROJECT_TYPE_NAME = ["Project", "File Index Project", "Folder Project", "Tag Project"];

export interface ProjectMap {
    fileProjects: string[];
    folderProjects: string[];
    tagProjects: string[];
    projectGroups: string[];
}

export class WSProject {
    name: string;
    readonly type: WSPType;
    collector: WSDataCollector;
    files: WSFile[];

    constructor(collector: WSDataCollector, name: string, type: WSPType = WSPType.Null) {
        this.collector = collector;
        this.name = name;
        this.type = type;
    };

    private toObject() {
        return {
            name: this.name,
            type: this.type,
            index: this.index
        };
    }

    serialize() {
        return JSON.stringify(this.toObject());
    }

    static fromSerialized(collector: WSDataCollector, serialized: string) {
        const proj: ReturnType<WSProject["toObject"]> = JSON.parse(serialized);

        return new WSProject(
            collector,
            proj.name,
            WSPType.Null
        );
    }

    get index() {
        return "";
    }

    get totalWords() {
        let count = 0;
        this.files.forEach(file => {
            count += file.words;
        });
        return count;
    }

    getFiles(): WSFile[] {
        let files: WSFile[];
        return files;
    }

    updateFiles() {
        let deletedItems: WSFile[] = [];
        let newItems = this.getFiles();
        while (this.files.length > 0) {
            let fi = this.files.pop();
            if (!newItems.contains(fi)) {
                deletedItems.push(fi);
            }
        }
        this.files = newItems;
        return deletedItems;
    }
}

export class WSFileProject extends WSProject {
    file: WSFile;

    constructor(collector: WSDataCollector, name: string, file: WSFile) {
        super(collector, name, WSPType.File);
        this.file = file;
    }

    static override fromSerialized(collector: WSDataCollector, serialized: string) {
        const proj: ReturnType<WSFileProject["toObject"]> = JSON.parse(serialized);
        let file = collector.getFileSafer(proj.index);
        if (file === null) {
            console.log(`Error creating WSFileProject(${proj.name}). Could not open file with path '${proj.index}'`);
            console.log(serialized);
            throw Error();
        }

        return new WSFileProject(
            collector,
            proj.name,
            file
        );
    }

    override get index() {
        return this.file.path;
    }

    override getFiles(): WSFile[] {
        return this.file.getLinkedRefs();
    }
}

export class WSFolderProject extends WSProject {
    folder: string;

    constructor(collector: WSDataCollector, name: string, folder: string) {
        super(collector, name, WSPType.Folder);
        this.folder = folder;
    }

    static override fromSerialized(collector: WSDataCollector, serialized: string) {
        const proj: ReturnType<WSFolderProject["toObject"]> = JSON.parse(serialized);

        return new WSFolderProject(
            collector,
            proj.name,
            proj.index
        );
    }

    override get index() {
        return this.folder;
    }

    override getFiles(): WSFile[] {
        return this.collector.fileList.filter((file => {
            file.path.startsWith(this.folder + "/");
        }));
    }
}

export class WSTagProject extends WSProject {
    tag: string;

    constructor(collector: WSDataCollector, name: string, tag: string) {
        super(collector, name, WSPType.Tag);
        this.tag = tag;
    }

    static override fromSerialized(collector: WSDataCollector, serialized: string) {
        const proj: ReturnType<WSTagProject["toObject"]> = JSON.parse(serialized);

        return new WSTagProject(
            collector,
            proj.name,
            proj.index
        );
    }

    override get index() {
        return this.tag;
    }

    override getFiles(): WSFile[] {
        return this.collector.fileList.filter((file => {
            file.tags.contains(this.tag);
        }));
    }
}

export class WSProjectGroup {
    name: string;
    projects: WSProject[];

    constructor(name: string, projects: WSProject[]) {
        this.name = name;
        this.projects = projects;
    };

    private toObject() {
        let projList: string[] = [];
        this.projects.forEach((proj: WSProject) => {
            projList.push(proj.name);
        });
        return { name: this.name, projects: projList };
    }

    serialize() {
        return JSON.stringify(this.toObject());
    }

    static fromSerialized(manager: WSProjectManager, serialized: string) {
        const grp: ReturnType<WSProjectGroup["toObject"]> = JSON.parse(serialized);

        let projects: WSProject[];
        grp.projects.forEach((gName => {
            if (manager.checkProjectName(gName)) {
                projects.push(manager.getProject(gName));
            } else {
                manager.logError(`Tried to deserialize project ${gName}, but no such project found. (in WSProjectGroup.fromSerialized((${grp.name}))`);
                console.log(grp.projects);
            }
        }));
        return new WSProjectGroup(
            grp.name,
            projects
        );
    }

}

/*

A Longform project is basically a project group, but it's a special case. Keeping track of its history may be somewhat boggling, though.
I can always auto-generate them on startup, but it makes more sense to generate them once and then just keep track of them.

People who are using Longform are likely to use Obsidian for all of the writing process and aren't going to change files outside, hopefully.

*/

export class WSProjectManager {
    tagProjects: WSTagProject[] = [];
    fileProjects: WSFileProject[] = [];
    folderProjects: WSFolderProject[] = [];
    projectGroups: Map<string, WSProjectGroup>;
    plugin: WordStatisticsPlugin = null;
    collector: WSDataCollector = null;
    projects: Map<string, [WSPType, WSProject]>;
    errorState: boolean = false;
    errorMessages: string[] = [];

    constructor(plugin: WordStatisticsPlugin, collector: WSDataCollector) {
        this.plugin = plugin;
        this.collector = collector;
        this.projects = new Map<string, [WSPType, WSProject]>();
        this.projectGroups = new Map<string, WSProjectGroup>();
    }

    get isEmpty() {
        return this.projects.size == 0;
    }

    getProjectsByType(type: WSPType): WSProject[] {
        switch (type) {
            case WSPType.File:
                return this.fileProjects as WSProject[];
            case WSPType.Folder:
                return this.folderProjects as WSProject[];
            case WSPType.Tag:
                return this.tagProjects as WSProject[];
        }
        return [];
    }

    private toObject() {
        let fileProjects: string[] = [];
        let folderProjects: string[] = [];
        let tagProjects: string[] = [];
        let projectGroups: string[] = [];

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

    serialize() {
        return JSON.stringify(this.toObject());
    }

    populateFromSerialized(serialized: string) {
        const man: ReturnType<WSProjectManager["toObject"]> = JSON.parse(serialized);

        man.fileProjects.forEach(obj => {
            let proj = WSFileProject.fromSerialized(this.collector, obj);
            this.registerProject(proj);
        });

        man.folderProjects.forEach(obj => {
            let proj = WSFolderProject.fromSerialized(this.collector, obj);
            this.registerProject(proj);
        });

        man.tagProjects.forEach(obj => {
            let proj = WSTagProject.fromSerialized(this.collector, obj);
            this.registerProject(proj);
        });

        man.projectGroups.forEach(obj => {
            let grp = WSProjectGroup.fromSerialized(this, obj);
            this.registerProjectGroup(grp);
        });
    }

    logError(msg: string) {
        this.errorState = true;
        this.errorMessages.push(msg);
        console.log("WordStatistics.ProjectManager[err]: " + msg);
    }

    checkProjectName(name: string) {
        return !this.projects.has(name);
    }

    checkProjectGroupName(name: string) {
        return !this.projectGroups.has(name);
    }

    getProject(name: string) {
        let [, proj] = this.projects.get(name);
        return proj;
    }

    getProjectNames() {
        return Array.from(this.projects.keys());
    }

    getProjectList(): WSProject[] {
        let list: WSProject[] = [];
        Array.from(this.projects.values()).forEach(([, proj]) => {
            list.push(proj);
        });
        return list;
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

    isIndexFile(file: WSFile) {
        this.fileProjects.forEach(fp => {
            if (fp.file === file) {
                return true;
            }
        });
        return false;
    }

    updateProjectsForIndex(file: WSFile) {
        this.fileProjects.forEach(proj => {
            if (proj.file === file) {
                this.updateProject(proj);
            }
        });
    }

    updateProjectsForTag(tag: string) {
        this.tagProjects.forEach((proj) => {
            if (proj.tag == tag) {
                this.updateProject(proj);
            }
        });
    }

    updateProjectsForFolder(folder: string) {
        this.folderProjects.forEach((proj) => {
            if (proj.folder == folder) {
                this.updateProject(proj);
            }
        });
    }

    updateProject(proj: WSProject) {
        proj.updateFiles();
        this.plugin.app.workspace.trigger("word-statistics-project-files-update", proj);
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
                this.fileProjects.push(<WSFileProject>proj);
                break;
            case WSPType.Folder:
                this.folderProjects.push(<WSFolderProject>proj);
                break;
            case WSPType.Tag:
                this.tagProjects.push(<WSTagProject>proj);
                break;
            default:
                console.log(proj);
                this.logError(`Invalid project type: ${proj.type} for project: ${proj}`);
                break;
        }
    }

    unregisterProject(proj: WSProject) {
        if (!this.projects.has(proj.name)) {
            console.log(this.projects, proj, proj.name);
            this.logError(`Tried to unregister project '${proj.name}', but it is not registered.`);
            throw Error();
        }
        switch (proj.type) {
            case WSPType.File:
                this.fileProjects.remove(<WSFileProject>proj);
                break;
            case WSPType.Folder:
                this.folderProjects.remove(<WSFolderProject>proj);
                break;
            case WSPType.Tag:
                this.tagProjects.push(<WSTagProject>proj);
                break;
            default:
                console.log(proj);
                this.logError(`Invalid project type: ${proj.type} for project: ${proj}`);
                break;
        }
        this.projects.delete(proj.name);
    }

    renameProject(proj: WSProject, name: string) {
        if (this.projects.has(name)) {
            let [, existingProj] = this.projects.get(name);
            if (existingProj != proj) {
                console.log(`Attempted to rename project '${proj.name}' to '${name}', but a project with that name already exists.`);
            }
            // else do nothing, as there is no need to rename it
            return;
        }
        this.projects.delete(proj.name);
        proj.name = name;
        this.projects.set(name, [proj.type, proj]);
        this.updateProject(proj);
    }

    deleteProject(proj: WSProject) {
        // unregister project
        this.unregisterProject(proj);
        // remove project from any outstanding groups
        this.projectGroups.forEach((group: WSProjectGroup) => {
            if (group.projects.contains(proj)) {
                group.projects.remove(proj);
            }
        });
    }

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
                this.updateProject(proj);
            });
        }
    }

    registerProjectGroup(group: WSProjectGroup) {
        if (this.projectGroups.has(group.name)) {
            console.log(this.projectGroups.get(group.name));
            this.logError(`Tried to register project group '${group.name}' but a group already exists with that name.`);
            return;
        }
        this.projectGroups.set(group.name, group);
    }

    unregisterProjectGroup(group: WSProjectGroup) {
        if (!this.projectGroups.has(group.name)) {
            console.log(this.projectGroups.get(group.name));
            this.logError(`Tried to unregister project group '${group.name}', but it is not registered.`);
            return;
        }

        this.projectGroups.delete(group.name);
    }
}
