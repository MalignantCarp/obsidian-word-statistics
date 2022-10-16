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
    Worldbuilding,
    Journaling
}

export const PROJECT_CATEGORY_NAME = ["None", "Writing", "Worldbuilding", "Journaling"];

export const PROJECT_TYPE_STRING = ["WSFileProject", "WSFolderProject", "WSTagProject"];
export const PROJECT_TYPE_NAME = ["File Index Project", "Folder Project", "Tag Project"];
export const PROJECT_TYPE_NAME_PLURAL = ["File Index Projects", "Folder Projects", "Tag Projects"];
export const PROJECT_INDEX_TYPE = ["File Index", "Folder", "Tag"];
export const PROJECT_TYPE_DESCRIPTION = [
    "Please select a file that will serve as the index for this project. Files within this project will always appear in the order in which they appear in the index markdown file.",
    "Please select a folder that will serve as the index for this project. Files within this project will appear in vault order or alphabetical order, depending on setting.",
    "Please select a tag that will serve as the index for this project. Files within this project will appear in vault order or alphabetial order, depending on setting."
];

/* Assuming we will at some point have a new version of the spec, this makes the most sense for loading.
   If the current version load routine returns null, can always fallback on prior version.
*/

export function SortProjectList(projects: WSProject[]) {
    return projects.sort((a, b) => a.fullPath.localeCompare(b.fullPath, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
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
        public wordGoalForFiles: number = 0,
        public iconID: string = "",
        public monitorCounts: boolean = false,
    ) { }

    abstract get index(): string;
    abstract getFiles(): WSFile[];

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
        public wordGoalForFiles: number = 0,
        public iconID: string = "",
        public monitorCounts: boolean = false,
    ) {
        super(collector, id, path, WSPType.File, category, _title, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts);
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
        public wordGoalForFiles: number = 0,
        public iconID: string = "",
        public monitorCounts: boolean = false,
    ) {
        super(collector, id, path, WSPType.Folder, category, _title, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts);
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
        public wordGoalForFiles: number = 0,
        public iconID: string = "",
        public monitorCounts: boolean = false,
        ) {
        super(collector, id, path, WSPType.Tag, category, _title, wordGoalForProject, wordGoalForFiles, iconID, monitorCounts);
    }

    get index() {
        return this.tag;
    }

    getFiles(): WSFile[] {
        return this.collector.fileList.filter(file => file.tags.contains(this.tag));
    }
}