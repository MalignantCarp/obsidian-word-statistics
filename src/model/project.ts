import type { WSDataCollector } from "./collector";
import { WSFile } from "./file";

export enum WSPType {
    File = 0,
    Folder,
    Tag
}

export enum WSPCategory {
    None = 0,
    Writing,
    Worldbuilding
}

export const PROJECT_CATEGORY_NAME = ["None", "Writing", "Worldbuilding"];

export const PROJECT_TYPE_STRING = ["WSFileProject", "WSFolderProject", "WSTagProject"];
export const PROJECT_TYPE_NAME = ["File Index Project", "Folder Project", "Tag Project"];
export const PROJECT_TYPE_NAME_PLURAL = ["File Index Projects", "Folder Projects", "Tag Projects"];
export const PROJECT_INDEX_TYPE = ["File Index", "Folder", "Tag"];
export const PROJECT_TYPE_DESCRIPTION = [
    "These projects are indexed by a file. Files within this project type will always appear in the order in which they appear in the index markdown file.",
    "These projects are indexed by a folder. Files within this project will appear in vault order or alphabetical order, depending on setting.",
    "These projects are indexed by a tag. Files within this project will appear in vault order or alphabetial oder, depending on setting."
];

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

/* Assuming we will at some point have a new version of the spec, this makes the most sense for loading.
   If the current version load routine returns null, can always fallback on prior version.
*/

export function SortProjectList(projects: WSProject[]) {
    return projects.sort((a, b) => a.fullPath.localeCompare(b.fullPath, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
}

function LoadProjectV0FromSerial(collector: WSDataCollector, projInfo: IProjectV0): WSProject {
    switch (projInfo.pType) {
        case WSPType.File:
            let file = collector.getFileSafer(projInfo.index);
            if (file != null) {
                return new WSFileProject(collector, projInfo.id, projInfo.path, file, projInfo.category, projInfo.title, projInfo.wordGoalForProject, projInfo.wordGoalForFiles);
            }
            console.log(`Attempted to load V0 Project from invalid data. File not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Folder:
            if (collector.getAllFolders().contains(projInfo.index)) {
                return new WSFolderProject(collector, projInfo.id, projInfo.path, projInfo.index, projInfo.category, projInfo.title, projInfo.wordGoalForProject, projInfo.wordGoalForFiles);
            }
            console.log(`Attempted to load V0 Project from invalid data. Folder not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Tag:
            if (collector.getAllTags().contains(projInfo.index)) {
                return new WSTagProject(collector, projInfo.id, projInfo.path, projInfo.index, projInfo.category, projInfo.title, projInfo.wordGoalForProject, projInfo.wordGoalForFiles);
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

export function LoadProjectFromSerial(collector: WSDataCollector, projInfo: IProjectV0): WSProject {
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

export abstract class WSProject {
    public files: WSFile[] = [];

    constructor(
        public collector: WSDataCollector,
        public id: string,
        public path: string,
        public readonly pType: WSPType,
        public category: WSPCategory,
        public _title: string,
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) { }

    abstract get index(): string;
    abstract getFiles(): WSFile[];

    private toObject(): IProjectV0 {
        return {
            id: this.id,
            path: this.path,
            pType: this.pType,
            title: this._title,
            category: this.category,
            index: this.index,
            wordGoalForProject: this.wordGoalForProject,
            wordGoalForFiles: this.wordGoalForFiles
        };
    }

    serialize() {
        return this.toObject();
    }

    set title(title: string) {
        this._title = title;
    }

    get title(): string {
        return (this._title || this.id);
    }

    get totalWords() {
        let count = 0;
        this.files.forEach(file => {
            count += file.words;
        });
        return count;
    }

    get fullPath(): string {
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
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) {
        super(collector, id, path, WSPType.File, category, _title, wordGoalForProject, wordGoalForFiles);
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
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) {
        super(collector, id, path, WSPType.Folder, category, _title, wordGoalForProject, wordGoalForFiles);
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
        public wordGoalForProject: number = 0,
        public wordGoalForFiles: number = 0
    ) {
        super(collector, id, path, WSPType.Tag, category, _title, wordGoalForProject, wordGoalForFiles);
    }

    get index() {
        return this.tag;
    }

    getFiles(): WSFile[] {
        return this.collector.fileList.filter(file => file.tags.contains(this.tag));
    }
}