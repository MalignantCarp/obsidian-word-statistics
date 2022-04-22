import WordStatisticsPlugin from "src/main";
import { WSDataCollector } from "./collector";
import { WSFile } from "./file";
import { WSProjectGroup } from "./group";
import { PROJECT_TYPE_STRING, WSFileProject, WSFolderProject, WSProject, WSPType, WSTagProject } from "./project";

export function CanProjectMoveUpInGroup(project: WSProject, group: WSProjectGroup) {
    return (group.projects.contains(project) && group.projects.indexOf(project) > 0);
}

export function CanProjectMoveDownInGroup(project: WSProject, group: WSProjectGroup) {
    return (group.projects.contains(project) && group.projects.indexOf(project) < (group.projects.length - 1));
}


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

    /* ===========================
        Attribute Getters/Setters
       =========================== */

    get isEmpty() {
        return this.projects.size == 0;
    }

    /* ===============
        Serialization
       =============== */

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

    /* ========
        Errors
       ======== */

    logError(msg: string) {
        this.errorState = true;
        this.errorMessages.push(msg);
        console.log("WordStatistics.ProjectManager[err]: " + msg);
    }

    /* ================
        Event Triggers
       ================ */

    triggerProjectUpdate(project: WSProject) {
        this.plugin.app.workspace.trigger("word-statistics-project-update", project);
    }

    triggerProjectGroupUpdated(group: WSProjectGroup) {
        this.plugin.app.workspace.trigger("word-statistics-project-group-updated", group);
    }

    triggerProjectGroupsChanged() {
        this.plugin.app.workspace.trigger("word-statistics-project-groups-changed");
    }

    triggerProjectFilesUpdate(project: WSProject) {
        this.plugin.app.workspace.trigger("word-statistics-project-files-update", project);
    }

    /* ==========
        Checkers
       ========== */

    checkProjectName(name: string) {
        return !this.projects.has(name);
    }

    checkProjectGroupName(name: string) {
        return !this.projectGroups.has(name);
    }

    isIndexFile(file: WSFile) {
        let matches = this.fileProjects.filter(fp => fp.file === file);
        // console.log(`isIndexFile(${file.path}) = ${matches.length > 0}`);
        return matches.length > 0;
    }

    /* =================
        Project Methods
       ================= */

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

    getProjectByName(name: string) {
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

    // Updating

    updateProject(proj: WSProject) {
        proj.updateFiles();
        this.triggerProjectFilesUpdate(proj);
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

    updateAllProjects() {
        this.projects.forEach(([, proj]) => {
            this.updateProject(proj);
        });
    }

    /* =======================
        Project Group Methods
       ======================= */

    getProjectGroupFromName(name: string): WSProjectGroup {
        return this.projectGroups.get(name);
    }

    getProjectsForGroupName(name: string): WSProject[] {
        return this.projectGroups.get(name)?.projects || [];
    }

    getProjectGroupNames() {
        return Array.from(this.projectGroups.keys()).sort();
    }

    getProjectGroupsAlpha() {
        let names = this.getProjectGroupNames();
        let groups: WSProjectGroup[] = [];
        names.forEach((name) => {
            groups.push(this.projectGroups.get(name));
        });
    }

    getProjectGroupDescendents(group: WSProjectGroup) {
        let descendents: WSProjectGroup[] = [];
        let names = this.getProjectGroupNames();
        names.forEach((name) => {
            if (name.startsWith(group.name + "/")) {
                descendents.push(this.projectGroups.get(name));
            }
        });
        return descendents;
    }

    projectGroupHasDescendents(group: WSProjectGroup) {
        let names = this.getProjectGroupNames();
        return names.some((checkName) => checkName.startsWith(group.name + "/"));
    }

    getProjectGroupNamesWithDescendents() {
        let groups: string[] = [];
        let names = this.getProjectGroupNames();
        names.forEach((name) => {
            //let matches = Array.from(name.matchAll(/([^/]+)/gmu));
            if (names.some((checkName) => checkName.startsWith(name + "/"))) {
                groups.push(name);
            }
        });
        return groups;
    }

    getProjectGroupsWithDescendents() {
        let groups: WSProjectGroup[];

        this.getProjectGroupNamesWithDescendents().forEach((name) => {
            groups.push(this.projectGroups.get(name));
        });
        return groups;
    }

    getProjectGroupsFromProject(proj: WSProject) {
        let groups: WSProjectGroup[] = [];
        this.projectGroups.forEach((group: WSProjectGroup) => {
            if (group.projects.contains(proj)) {
                groups.push(group);
            }
        });
        return groups;
    }

    /* ====================
        Project Management
       ==================== */

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
                this.updateProjectGroup(group);
            }
        });
    }

    /* ==================
        Group Management
       ================== */

    registerProjectGroup(group: WSProjectGroup) {
        if (this.projectGroups.has(group.name)) {
            console.log(this.projectGroups.get(group.name));
            this.logError(`Tried to register project group '${group.name}' but a group already exists with that name.`);
            return;
        }
        this.projectGroups.set(group.name, group);
        this.triggerProjectGroupsChanged();
    }

    unregisterProjectGroup(group: WSProjectGroup) {
        if (!this.projectGroups.has(group.name)) {
            console.log(this.projectGroups.get(group.name));
            this.logError(`Tried to unregister project group '${group.name}', but it is not registered.`);
            return;
        }
        this.projectGroups.delete(group.name);
        this.triggerProjectGroupsChanged();
    }

    renameProjectGroup(group: WSProjectGroup, name: string) {
        if (this.projectGroups.has(name)) {
            let existingGroup = this.projectGroups.get(name);
            if (existingGroup != group) {
                console.log(`Attempted to rename project group '${group.name}' to '${name}', but a project with that name already exists.`);
            }
            // else do nothing, as there is no need to rename it
            return;
        }
        this.projectGroups.delete(group.name);
        group.name = name;
        this.projectGroups.set(name, group);
        this.triggerProjectGroupsChanged();
    }

    updateProjectGroup(group: WSProjectGroup) {
        group.projects.forEach((project) => {
            this.updateProject(project);
        });
        this.triggerProjectGroupUpdated(group);
    }

    addProjectToGroup(project: WSProject, group: WSProjectGroup) {
        if (!group.projects.contains(project)) {
            group.projects.push(project);
            this.updateProjectGroup(group);
        }
    }

    removeProjectFromGroup(project: WSProject, group: WSProjectGroup) {
        if (group.projects.contains(project)) {
            group.projects.remove(project);
            this.updateProjectGroup(group);
        }
    }

    moveProjectUpInGroup(project: WSProject, group: WSProjectGroup) {
        if (group.projects.contains(project)) {
            let position = group.projects.indexOf(project);
            if (position > 0) {
                group.projects.remove(project);
                group.projects.splice(position - 1, 0, project);
                this.updateProjectGroup(group);
            } else {
                console.log(`Attempted to move project '${project.name}' up in group '${group.name},' but it is first in group.`);
            }
        } else {
            console.log(`Attempted to move project '${project.name}' up in group '${group.name},' but it is not in group.`);
        }
    }

    moveProjectDownInGroup(project: WSProject, group: WSProjectGroup) {
        if (group.projects.contains(project)) {
            let position = group.projects.indexOf(project);
            if (position < (group.projects.length - 1)) {
                group.projects.remove(project);
                group.projects.splice(position + 1, 0, project);
                this.updateProjectGroup(group);
            } else {
                console.log(`Attempted to move project '${project.name}' down in group '${group.name},' but it is last in group.`);
            }
        } else {
            console.log(`Attempted to move project '${project.name}' down in group '${group.name},' but it is not in group.`);
        }
    }

}
