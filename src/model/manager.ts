import { WSEvents, WSProjectEvent, WSPathEvent } from "./event";
import type WordStatisticsPlugin from "src/main";
import { ModalLoader } from "src/ui/ModalLoader";
import type { WSDataCollector } from "./collector";
import type { WSFile } from "./file";
import { LoadPathFromSerial, LoadProjectFromSerial, WSFileProject, WSFolderProject, WSPCategory, WSProject, WSPath, WSPType, WSTagProject, type IPathV0, type IProjectV0, type IProjectV1, SortProjectList } from "./project";

interface ProjectManagerJSON {
    projects: string[],
    paths: string[],
}

export interface IProjectManagerV0 {
    projects: IProjectV0[],
    paths: IPathV0[];
}

export interface IProjectManager {
    projects: WSProject[];
    paths: WSPath[];
}

function ProcessAllContent(manager: WSProjectManager, content: IProjectManagerV0): IProjectManager {
    let projects: WSProject[] = [];
    let paths: WSPath[] = [];

    content.projects.forEach((info) => {
        let proj = LoadProjectFromSerial(manager.collector, info);
        if (proj instanceof WSTagProject) {
            projects.push(proj);
        } else {
            console.log(`Error processing project manager content for project '${info.id}'. Deserialization returned invalid type '${typeof (proj)}'`);
        }
    });

    content.paths.forEach((info) => {
        let folder = LoadPathFromSerial(info);
        if (folder instanceof WSPath) {
            paths.push(folder);
        }
    });

    return { projects, paths };
}

function ParseProjectManagerContentV0(manager: WSProjectManager, data: string) {
    try {
        // console.log("Attempting to parse data into ProjectManagerJSON");
        let content = JSON.parse(data) as ProjectManagerJSON;
        // console.log(content);
        // console.log("Attempting to parse Projects into IProjectV0");
        let projects: IProjectV0[] = [];
        content.projects.forEach((value) => {
            projects.push(JSON.parse(value) as IProjectV0);
        });
        // console.log(folderProjects);
        // console.log("Attempting to parse Project Groups into IProjectGroupV0");
        let paths: IPathV0[] = [];
        content.paths.forEach((value) => {
            paths.push(JSON.parse(value) as IPathV0);
        });
        // console.log(projectGroups);
        return ProcessAllContent(manager, { projects, paths });
    } catch (error) {
        console.log("Error parsing project manager content (V0):", error);
        return undefined;
    }
}

// function ParseProjectManagerContentV1(manager: WSProjectManager, data: string) {
// }

export function ParseProjectManagerContent(manager: WSProjectManager, data: string) {
    let content: IProjectManager;

    content = ParseProjectManagerContentV0(manager, data);
    // if (content === undefined) {
    //     console.log("Failed to load as V1, falling back to V0.");
    //     content = ParseProjectManagerContentV0(manager, data);
    // }
    // if (content === undefined) {
    //     console.log("Failed to load project manager");
    //     return null;
    // }
    return content;
}

export class WSProjectManager {
    projectList: WSProject[];
    paths: Map<string, WSPath>;
    pathRoot: WSPath = new WSPath("", "", 0);
    projects: Map<string, [WSPType, WSProject]>;
    errorState: boolean = false;
    errorMessages: string[] = [];
    modals: ModalLoader;

    constructor(public plugin: WordStatisticsPlugin, public collector: WSDataCollector) {
        this.projectList = [];
        this.projects = new Map<string, [WSPType, WSProject]>();
        this.paths = new Map<string, WSPath>();
        this.modals = new ModalLoader(this.plugin, this);
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
        let projects: string[] = [];
        let paths: string[] = [];

        this.projectList.forEach((proj) => {
            projects.push(proj.serialize());
        });
        this.paths.forEach((grp) => {
            paths.push(grp.serialize());
        });
        return { projects, paths };
    }

    serialize() {
        return JSON.stringify(this.toObject());
    }

    validateProjectLoad(projects: WSProject[]) {
        let ids: string[] = [];
        projects.forEach((proj) => {
            if (ids.contains(proj.id)) {
                console.log(`Project ID already in use: ${proj.id}`);
                return false;
            }
            ids.push(proj.id);
        });
        return true;
    }

    validatePathLoad(paths: WSPath[]) {
        let names: string[] = [];
        paths.forEach((path) => {
            if (names.contains(path.path)) {
                console.log(`Project Path already exists: ${path.path}`);
                return false;
            }
            names.push(path.path);
        });
        return true;
    }

    loadProjectManagerData(data: IProjectManager) {
        if (this.validateProjectLoad(data.projects)) {
            if (this.validatePathLoad(data.paths)) {
                data.projects.forEach((proj) => {
                    this.registerProject(proj);
                });
                data.paths.forEach((path) => {
                    this.registerPath(path);
                });
            }
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

    /* ==========
        Checkers
       ========== */

    checkProjectID(id: string) {
        return !this.projects.has(id);
    }

    checkPathName(name: string) {
        return !this.paths.has(name);
    }

    isIndexFile(file: WSFile) {
        let matches = this.projectList.filter(fp => fp.pType === WSPType.File && (<WSFileProject>fp).file === file);
        // console.log(`isIndexFile(${file.path}) = ${matches.length > 0}`);
        return matches.length > 0;
    }

    getWordGoalForFileByContext(file: WSFile, project: WSProject) {
        if (file.wordGoal) {
            return file.wordGoal;
        }
        if (project instanceof WSProject) {
            if (project.wordGoalForFiles) {
                return project.wordGoalForFiles;
            }
            if (this.paths.has(project.path)) {
                let path = this.paths.get(project.path);
                if (path instanceof WSPath) {
                    if (path.wordGoalForFiles) {
                        return path.wordGoalForFiles;
                    }
                }
            }
        }
        return undefined;
    }

    /* =================
        Project Methods
       ================= */

    getAllProjects(): WSProject[] {
        let projects: WSProject[] = [];
        projects.push(...this.projectList);
        return SortProjectList(projects);
    }

    getProjectsByPath(path: string) {
        return SortProjectList(this.projectList.filter((proj) => proj.fullPath.startsWith(path)));
    }

    getProjectsByType(type: WSPType): WSProject[] {
        return SortProjectList(this.projectList.filter((proj) => proj.pType == type));
    }

    getFileProjects() {
        return SortProjectList(this.projectList.filter((proj) => proj.pType == WSPType.File));
    }

    getFolderProjects() {
        return SortProjectList(this.projectList.filter((proj) => proj.pType == WSPType.Folder));
    }

    getTagProjects() {
        return SortProjectList(this.projectList.filter((proj) => proj.pType == WSPType.Tag));
    }

    getProjectsByFile(file: WSFile) {
        let projects: WSProject[] = [];

        this.projectList.forEach((project) => {
            if (project.files.contains(file)) {
                projects.push(project);
            }
        });
        return projects;
    }

    getProjectByID(id: string) {
        let [, proj] = this.projects.get(id);
        return proj;
    }

    getProjectIDs() {
        return Array.from(this.projects.keys());
    }

    getProjectList(): WSProject[] {
        return this.projectList;
    }

    getIndexFile(proj: WSProject) {
        if (proj.pType === WSPType.File) {
            return this.collector.getFile(proj.index);
        }
        return undefined;
    }

    getIndexTag(proj: WSProject) {
        if (proj.pType === WSPType.Tag) {
            return proj.index;
        }
        return undefined;
    }

    getIndexFolder(proj: WSProject) {
        if (proj.pType === WSPType.Folder) {
            return proj.index;
        }
        return undefined;
    }

    // Updating

    updateProject(proj: WSProject) {
        proj.updateFiles();
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.FilesUpdated, project: proj }, { filter: proj }));
    }

    updateProjectsForIndex(file: WSFile) {
        this.projectList.forEach(proj => {
            if (proj.pType === WSPType.File && (<WSFileProject>proj).file === file) {
                this.updateProject(proj);
            }
        });
    }

    updateProjectsForTag(tag: string) {
        this.projectList.forEach((proj) => {
            if (proj.pType === WSPType.Tag && (<WSTagProject>proj).tag === tag) {
                this.updateProject(proj);
            }
        });
    }

    updateProjectsForFolder(folder: string) {
        this.projectList.forEach((proj) => {
            if (proj.pType === WSPType.Folder && (<WSFolderProject>proj).folder === folder) {
                this.updateProject(proj);
            }
        });
    }

    updateProjectsForFile(file: WSFile) {
        this.projectList.forEach((project) => {
            if (project.files.contains(file)) {
                this.updateProject(project);
            }
        });
    }

    updateAllProjects() {
        this.projects.forEach(([, proj]) => {
            this.updateProject(proj);
        });
    }

    /* ======================
        Project Path Methods
       ====================== */

    getSetPaths() {
        return Array.from(this.paths.keys()).sort((a, b) => a.localeCompare(b, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    }

    getPaths() {
        return this.pathRoot.getAll();
    }

    getPathStrings() {
        let paths = this.pathRoot.getAll();
        let pathStrings: string[] = [];
        paths.forEach((path) => {
            pathStrings.push(path.path);
        });
        return pathStrings;
    }

    setPath(path: string, title: string, category: WSPCategory, wordGoalForPath: number, wordGoalForProjects: number, wordGoalForFiles: number) {
        let pathObj = this.getPath(path);
        pathObj.title = title;
        pathObj.category = category;
        pathObj.wordGoalForPath = wordGoalForPath;
        pathObj.wordGoalForProjects = wordGoalForProjects;
        pathObj.wordGoalForFiles = wordGoalForFiles;
        this.registerPath(pathObj);
        return pathObj;
    }

    clearPath(path: string) {
        let pathObj = this.getPath(path);
        this.setPathTitle(pathObj);
        this.setPathWordGoals(pathObj);
        this.setPathCategory(pathObj);
        this.unregisterPath(pathObj);
    }

    getPath(path: string): WSPath {
        return this.pathRoot.getPath(path);
    }

    getParentPath(path: WSPath) {
        return this.pathRoot.findParentOfChild(path);
    }

    buildPath(path: string) {
        if (path.length > 0 && !(this.paths.has(path) || this.pathRoot.getPath(path))) {
            let root = this.pathRoot;
            let currentPath = root;
            let pathRe = new RegExp(/([^/]+)/, 'gmu');
            let segments: string[];
            let lastIndex = 0;
            while (pathRe.test(path)) {
                segments.push(path.slice(lastIndex, pathRe.lastIndex));
                lastIndex = pathRe.lastIndex + 1;
            }
            let builtPath: string;
            for (let i = 0; i < segments.length; i++) {
                builtPath += segments[i];
                if (this.paths.has(builtPath)) {
                    currentPath = this.paths.get(builtPath);
                } else {
                    currentPath = new WSPath(builtPath, "", WSPCategory.None);
                    if (!root.hasChild(currentPath)) {
                        root.addChild(currentPath);
                    }
                    this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Created, path: currentPath }, { filter: currentPath }));
                }
                root = currentPath;
                if (i < segments.length - 1) {
                    builtPath += "/";
                };
            }
        }


    }

    /* ====================
        Project Management
       ==================== */

    updateProjectGoals(project: WSProject, wordGoalForProject: number, wordGoalForFiles: number) {
        project.wordGoalForProject = wordGoalForProject;
        project.wordGoalForFiles = wordGoalForFiles;
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Updated, project: project }, { filter: project }));
    }

    updateProjectIndex(project: WSProject, projectIndex: string) {
        if (project.pType === WSPType.File) {
            let file = this.collector.getFileSafer(projectIndex);
            let fp = <WSFileProject>project;
            if (file != fp.file) {
                fp.file = file;
                this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Updated, project }, { filter: project }));
                this.updateProject(project);
            }
        } else if (project.pType === WSPType.Folder) {
            let fp = <WSFolderProject>project;
            if (fp.folder != projectIndex) {
                fp.folder = projectIndex;
                this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Updated, project }, { filter: project }));
                this.updateProject(project);
            }
        } else if (project.pType === WSPType.Tag) {
            let tp = <WSTagProject>project;
            if (tp.tag != projectIndex) {
                tp.tag = projectIndex;
                this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Updated, project }, { filter: project }));
                this.updateProject(project);
            }
        }
    }

    createProject(type: WSPType, projectID: string, path: string, projectIndex: string, projectCategory: WSPCategory, title: string, wordGoalForProject: number, wordGoalForFiles: number) {
        let project: WSProject;

        if (type === WSPType.File) {
            let file = this.collector.getFileSafer(projectIndex);
            project = new WSFileProject(this.collector, projectID, path, file, projectCategory, title, [], wordGoalForProject, wordGoalForFiles);
        } else if (type === WSPType.Folder) {
            project = new WSFolderProject(this.collector, projectID, path, projectIndex, projectCategory, title, [], wordGoalForProject, wordGoalForFiles);
        } else if (type === WSPType.Tag) {
            project = new WSTagProject(this.collector, projectID, path, projectIndex, projectCategory, title, [], wordGoalForProject, wordGoalForFiles);
        } else {
            this.logError(`Attempted to create a project with an invalid type: ${type}`);
            return;
        }
        this.registerProject(project);
        // return (project);
    }

    registerProject(proj: WSProject) {
        if (this.projects.has(proj.id)) {
            this.logError(`Tried to register project with ID '${proj.id}', but one with that ID already exists: ${this.projects.get(proj.id)[1].fullPath}`);
            throw Error();
        }
        this.projects.set(proj.id, [proj.pType, proj]);
        this.projectList.push(proj);
        if (proj.pType === WSPType.File) {
            this.collector.forceUpdateFile((<WSFileProject>proj).file);
        }
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Created, project: proj }, { filter: proj }));
        this.updateProject(proj);
    }

    unregisterProject(proj: WSProject) {
        if (!this.projects.has(proj.id)) {
            this.logError(`Tried to unregister project with ID '${proj.id}', but it is not registered.`);
            throw Error();
        }
        let path = proj.path;
        this.projects.delete(proj.id);
        this.projectList.remove(proj);
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Deleted, project: proj }, { filter: proj }));
        if (this.plugin.settings.clearEmptyPaths && this.paths.has(path) && this.getProjectsByPath(path).length == 0) {
            this.unregisterPath(this.paths.get(path));
        }
    }

    reIDProject(proj: WSProject, newID: string) {
        if (this.projects.has(newID)) {
            let [, existingProj] = this.projects.get(newID);
            if (existingProj != proj) {
                console.log(`Attempted to re-assign project ID from '${proj.id}' to '${newID}', but a project with the new ID already exists.`);
            }
            // else do nothing, as there is no need to rename it
            return;
        }
        let oldID = proj.id;
        this.projects.delete(proj.id);
        proj.id = newID;
        this.projects.set(newID, [proj.pType, proj]);
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Renamed, project: proj, data: [oldID, newID] }, { filter: proj }));
        // this.updateProject(proj);
    }

    retitleProject(proj: WSProject, newTitle: string) {
        let oldTitle = proj.title;
        proj.title = newTitle;
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Renamed, project: proj, data: [oldTitle, newTitle] }, { filter: proj }));
    }

    categorizeProject(proj: WSProject, newCategory: WSPCategory) {
        let oldCat = proj.category;
        proj.category = newCategory;
        this.plugin.events.trigger(new WSProjectEvent({ type: WSEvents.Project.Updated, project: proj }, { filter: proj }));
    }

    deleteProject(proj: WSProject) {
        // unregister project
        this.unregisterProject(proj);
        // cleanup paths
        let path = this.getPath(proj.path);
        if (!path.hasChildren() && !path.hasProjects && this.plugin.settings.clearEmptyPaths) {
            this.clearPath(path.path);
            let parent = this.getParentPath(path);
            if (parent instanceof WSPath) {
                parent.removeChild(path);
            }
            this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Deleted, path }, { filter: path }));
        }
    }

    /* ==================
        Group Management
       ================== */

    registerPath(path: WSPath) {
        if (this.paths.has(path.path)) {
            console.log(this.paths.get(path.path));
            this.logError(`Tried to set path '${path.path}', but it is already registered.`);
            return;
        }
        this.paths.set(path.path, path);
        this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Set, path }, { filter: path }));
    }

    unregisterPath(path: WSPath) {
        if (!this.paths.has(path.path)) {
            console.log(this.paths.get(path.path));
            this.logError(`Tried to clear path '${path.path}', but it is not set.`);
            return;
        }
        this.paths.delete(path.path);
        this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Cleared, path }, { filter: path }));
    }

    setPathTitle(path: WSPath, title: string = "") {
        if (title != path.title) {
            path.title = title;
            this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Titled, path }, { filter: path }));
        }
    }

    setPathWordGoals(path: WSPath, goalForPath: number = 0, goalForProjects: number = 0, goalForFiles: number = 0) {
        let changed = path.wordGoalForPath != goalForPath || path.wordGoalForProjects != goalForProjects || path.wordGoalForFiles != goalForFiles;

        path.wordGoalForPath = goalForPath;
        path.wordGoalForProjects = goalForProjects;
        path.wordGoalForFiles = goalForFiles;
        if (changed) {
            this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Updated, path }, { filter: path }));
        }
    }

    setPathCategory(path: WSPath, category: WSPCategory = WSPCategory.None) {
        let changed = category != path.category;

        path.category = category;
        if (changed) {
            this.plugin.events.trigger(new WSPathEvent({ type: WSEvents.Path.Updated, path }, { filter: path }));
        }
    }

    /* =====================
        Validation Routines
       ===================== */

    validateProjectID(id: string): [boolean, string] {
        let empty = id.length === 0;
        let valid = this.checkProjectID(id);
        let error = empty ? "Project name must not be blank." : !valid ? "Project name must be unique." : "";
        return [!empty && valid, error];
    }

    validatePath(path: string): [boolean, string] {
        let invalidChars = ["/", " "];
        let endingSlash = invalidChars.contains(path.charAt(path.length - 1));
        let startingSlash = path.length > 0 && invalidChars.contains(path.charAt(0));
        let error = "";
        if (startingSlash && !endingSlash) {
            error = "Path must not begin with a forward-slash (/) or space.";
        } else if (endingSlash && !startingSlash) {
            error = "Path must not end with a forward-slash (/) or space.";
        } else {
            error = "Path must not begin or end with a forward-slash (/) or space.";
        }
        return [!endingSlash && !startingSlash, error];
    }
}
