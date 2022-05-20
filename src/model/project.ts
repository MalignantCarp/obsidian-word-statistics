import type { WSDataCollector } from "./collector";
import { WSFile } from "./file";

export enum WSPType {
    Null = 0,
    File,
    Folder,
    Tag
}

export enum WSPCategory {
    None = 0,
    Writing,
    Worldbuilding
}

export const PROJECT_CATEGORY_NAME = ["None", "Writing", "Worldbuilding"];

export const PROJECT_TYPE_STRING = ["WSProject", "WSFileProject", "WSFolderProject", "WSTagProject"];
export const PROJECT_TYPE_NAME = ["Project", "File Index Project", "Folder Project", "Tag Project"];
export const PROJECT_TYPE_NAME_PLURAL = ["Projects", "File Index Projects", "Folder Projects", "Tag Projects"];
export const PROJECT_INDEX_TYPE = ["Project", "File Index", "Folder", "Tag"];
export const PROJECT_TYPE_DESCRIPTION = ["<##You should never see this message##>",
    "These projects are indexed by a file. Files within this project type will always appear in the order in which they appear in the index markdown file.",
    "These projects are indexed by a folder. Files within this project will appear in vault order or alphabetical order, depending on setting.",
    "These projects are indexed by a tag. Files within this project will appear in vault order or alphabetial oder, depending on setting."
];

export interface ProjectMap {
    projects: WSProject[],
    folders: WSPath[]
}

export interface IPathV0 {
    path: string,
    title: string,
    category: WSPCategory,
    wordGoalForFolder: number,
    wordGoalForProjects: number,
    wordGoalForFiles: number,
    iconID: string
}

export interface IProjectV0 {
    id: string,
    path: string,
    pType: WSPType,
    title: string,
    index: string,
    category: WSPCategory,
    wordGoalForProject: number,
    wordGoalForFiles: number;
}

export interface IProjectV1 {
    id: string,
    path: string,
    pType: WSPType,
    title: string,
    index: string,
    category: WSPCategory,
    wordGoalForProject: number,
    wordGoalForFiles: number;
}

/* Assuming we will at some point have a new version of the spec, this makes the most sense for loading.
   If the current version load routine returns null, can always fallback on prior version.
*/

function LoadProjectV0FromSerial(collector: WSDataCollector, projInfo: IProjectV0): WSProject {
    switch (projInfo.pType) {
        case WSPType.File:
            let file = collector.getFileSafer(projInfo.index);
            if (file != null) {
                return new WSFileProject(collector, projInfo.id, projInfo.path, file, projInfo.category, projInfo.title, [], projInfo.wordGoalForProject, projInfo.wordGoalForFiles);
            }
            console.log(`Attempted to load V0 Project from invalid data. File not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Folder:
            if (collector.getAllFolders().contains(projInfo.index)) {
                return new WSFolderProject(collector, projInfo.id, projInfo.path, projInfo.index, projInfo.category, projInfo.title, [], projInfo.wordGoalForProject, projInfo.wordGoalForFiles);
            }
            console.log(`Attempted to load V0 Project from invalid data. Folder not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Tag:
            if (collector.getAllTags().contains(projInfo.index)) {
                return new WSTagProject(collector, projInfo.id, projInfo.path, projInfo.index, projInfo.category, projInfo.title, [], projInfo.wordGoalForProject, projInfo.wordGoalForFiles);
            }
            console.log(`Attempted to load V0 Project from invalid data. Tag not found for '${projInfo.index}':`, projInfo);
            break;
        default:
            console.log(`Attempted to load V0 Project from invalid data. Unknown project type '${projInfo.pType}':`, projInfo);
            break;
    }
    return null;
};

// function LoadProjectV1FromSerial(collector: WSDataCollector, projInfo: IProjectV1): WSProject {
//     return null;
// };

export function LoadProjectFromSerial(collector: WSDataCollector, projInfo: IProjectV0 | IProjectV1): WSProject {
    let project: WSProject;
    // project = LoadProjectV1FromSerial(collector, projInfo as IProjectV1);
    // if (project === null) {
    //     console.log("Falling back on Project V0.");
    //     project = LoadProjectV0FromSerial(collector, projInfo as IProjectV0);
    // }
    project = LoadProjectV0FromSerial(collector, projInfo as IProjectV0);
    if (project === null) {
        console.log("Failed to load project:", projInfo);
    }
    return project;
}

function LoadPathV0FromSerial(folderInfo: IPathV0): WSPath {
    let folder: WSPath;
    folder = new WSPath(folderInfo.path, folderInfo.title, folderInfo.category, folderInfo.wordGoalForFolder, folderInfo.wordGoalForProjects, folderInfo.wordGoalForFiles, folderInfo.iconID);
    return folder;
}

export function LoadPathFromSerial(folderInfo: IPathV0): WSPath {
    let folder = LoadPathV0FromSerial(folderInfo as IPathV0);
    if (folder === null) {
        console.log("Failed to load project folder:", folderInfo);
    }
    return folder;
}

export class WSPath {
    constructor(
        public path: string,
        public title: string,
        public category: WSPCategory,
        public wordGoalForPath?: number,
        public wordGoalForProjects?: number,
        public wordGoalForFiles?: number,
        public iconID: string = ""
    ) { }

    private toObject() {
        return {
            path: this.path,
            title: this.title,
            category: this.category,
            wordGoalForFolder: this.wordGoalForPath || 0,
            wordGoalForProjects: this.wordGoalForProjects || 0,
            wordGoalForFiles: this.wordGoalForFiles || 0,
            iconID: ""
        };
    }

    serialize() {
        return JSON.stringify(this.toObject());
    }
}

export abstract class WSProject {
    constructor(
        public collector: WSDataCollector,
        public id: string,
        public path: string,
        public readonly pType: WSPType,
        public category: WSPCategory,
        public _title: string,
        public files: WSFile[] = [],
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) { }

    abstract get index(): string;
    abstract getFiles(): WSFile[];

    private toObject() {
        return {
            id: this.id,
            path: this.path,
            type: this.pType,
            title: this._title,
            category: this.category,
            index: this.index,
            wordGoalForProject: this.wordGoalForProject,
            wordGoalForFiles: this.wordGoalForFiles
        };
    }

    serialize() {
        return JSON.stringify(this.toObject());
    }

    get title(): string {
        return (this.title || this.id);
    }

    get totalWords() {
        let count = 0;
        this.files.forEach(file => {
            count += file.words;
        });
        return count;
    }

    get fullPath():string {
        return this.path + "/" + this.id;
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
    constructor(
        public collector: WSDataCollector,
        public id: string,
        public path: string,
        public file: WSFile,
        public category: WSPCategory,
        public _title: string,
        public files: WSFile[] = [],
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) {
        super(collector, id, path, WSPType.File, category, _title, [], wordGoalForProject, wordGoalForFiles);
        if (file instanceof WSFile) {
            this.file = file;
        } else {
            throw Error(`Tried to create WSFileProject '${path}/${id}' with null file.`);
        }
    }

    get index() {
        if (this.file instanceof WSFile) {
            return this.file.path;
        }
        return null;
    }

    getFiles(): WSFile[] {
        if (this.file instanceof WSFile) {
            // console.log(this.file);
            return this.file.getLinkedRefs();
        }
        return [];
    }
}

export class WSFolderProject extends WSProject {
    constructor(
        public collector: WSDataCollector,
        public id: string,
        public path: string,
        public folder: string,
        public category: WSPCategory,
        public _title: string,
        public files: WSFile[] = [],
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) {
        super(collector, id, path, WSPType.Folder, category, _title, [], wordGoalForProject, wordGoalForFiles);
    }

    get index() {
        return this.folder;
    }

    getFiles(): WSFile[] {
        return this.collector.fileList.filter(file => file.path.startsWith(this.folder + "/"));
    }
}

export class WSTagProject extends WSProject {
    constructor(
        public collector: WSDataCollector,
        public id: string,
        public path: string,
        public tag: string,
        public category: WSPCategory,
        public _title: string,
        public files: WSFile[] = [],
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) {
        super(collector, id, path, WSPType.Tag, category, _title, [], wordGoalForProject, wordGoalForFiles);
    }

    get index() {
        return this.tag;
    }

    getFiles(): WSFile[] {
        return this.collector.fileList.filter(file => file.tags.contains(this.tag));
    }
}