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
    fileProjects: string[];
    folderProjects: string[];
    tagProjects: string[];
    projectGroups: string[];
}

export interface IProjectV0 {
    name: string,
    type: WSPType,
    index: string;
}

export interface IProjectV1 {
    name: string,
    type: WSPType,
    index: string,
    category: WSPCategory;
}

/* Assuming we will at some point have a new version of the spec, this makes the most sense for loading.
   If the current version load routine returns null, can always fallback on prior version.
*/

function LoadProjectV0FromSerial(collector: WSDataCollector, projInfo: IProjectV0): WSProject {
    switch (projInfo.type) {
        case WSPType.File:
            let file = collector.getFileSafer(projInfo.index);
            if (file != null) {
                return new WSFileProject(collector, projInfo.name, file, WSPCategory.None);
            }
            console.log(`Attempted to load V0 Project from invalid data. File not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Folder:
            if (collector.getAllFolders().contains(projInfo.index)) {
                return new WSFolderProject(collector, projInfo.name, projInfo.index, WSPCategory.None);
            }
            console.log(`Attempted to load V0 Project from invalid data. Folder not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Tag:
            if (collector.getAllTags().contains(projInfo.index)) {
                return new WSTagProject(collector, projInfo.name, projInfo.index, WSPCategory.None);
            }
            console.log(`Attempted to load V0 Project from invalid data. Tag not found for '${projInfo.index}':`, projInfo);
            break;
        default:
            console.log(`Attempted to load V0 Project from invalid data. Unknown project type '${projInfo.type}':`, projInfo);
            break;
    }
    return null;
};

function LoadProjectV1FromSerial(collector: WSDataCollector, projInfo: IProjectV1): WSProject {
    if (projInfo.category === undefined) {
        console.log(`Attempted to load V1 Project from invalid data. Category is undefined.`, projInfo);
        return null;
    }
    switch (projInfo.type) {
        case WSPType.File:
            let file = collector.getFileSafer(projInfo.index);
            if (file != null) {
                return new WSFileProject(collector, projInfo.name, file, projInfo.category);
            }
            console.log(`Attempted to load V1 Project from invalid data. File not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Folder:
            if (collector.getAllFolders().contains(projInfo.index)) {
                return new WSFolderProject(collector, projInfo.name, projInfo.index, projInfo.category);
            }
            console.log(`Attempted to load V1 Project from invalid data. Folder not found for '${projInfo.index}':`, projInfo);
            break;
        case WSPType.Tag:
            if (collector.getAllTags().contains(projInfo.index)) {
                return new WSTagProject(collector, projInfo.name, projInfo.index, projInfo.category);
            }
            console.log(`Attempted to load V1 Project from invalid data. Tag not found for '${projInfo.index}':`, projInfo);
            break;
        default:
            console.log(`Attempted to load V1 Project from invalid data. Unknown project type '${projInfo.type}':`, projInfo);
            break;
    }
    return null;
};

export function LoadProjectFromSerial(collector: WSDataCollector, projInfo: IProjectV0 | IProjectV1): WSProject {
    let project = LoadProjectV1FromSerial(collector, projInfo as IProjectV1);
    if (project === null) {
        console.log("Falling back on Project V0.");
        project = LoadProjectV0FromSerial(collector, projInfo as IProjectV0);
    }
    if (project === null) {
        console.log("Failed to load project:", projInfo);
    }
    return project;
}

export abstract class WSProject {
    name: string;
    readonly type: WSPType;
    collector: WSDataCollector;
    category: WSPCategory;
    files: WSFile[];

    constructor(collector: WSDataCollector, name: string, type: WSPType, category: WSPCategory) {
        this.collector = collector;
        this.name = name;
        this.type = type;
        this.category = category;
        this.files = [];
    };

    abstract get index(): string;
    abstract getFiles(): WSFile[];

    private toObject() {
        return {
            name: this.name,
            type: this.type,
            index: this.index,
            category: this.category
        };
    }

    serialize() {
        return JSON.stringify(this.toObject(), null, '\t');
    }

    get totalWords() {
        let count = 0;
        this.files.forEach(file => {
            count += file.words;
        });
        return count;
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

    constructor(collector: WSDataCollector, name: string, file: WSFile, category: WSPCategory) {
        super(collector, name, WSPType.File, category);
        if (file instanceof WSFile) {
            this.file = file;
        } else {
            throw Error(`Tried to create WSFileProject '${name}' with null file.`);
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
    folder: string;

    constructor(collector: WSDataCollector, name: string, folder: string, category: WSPCategory) {
        super(collector, name, WSPType.Folder, category);
        this.folder = folder;
    }

    get index() {
        return this.folder;
    }

    getFiles(): WSFile[] {
        return this.collector.fileList.filter(file => file.path.startsWith(this.folder + "/"));
    }
}

export class WSTagProject extends WSProject {
    tag: string;

    constructor(collector: WSDataCollector, name: string, tag: string, category: WSPCategory) {
        super(collector, name, WSPType.Tag, category);
        this.tag = tag;
    }

    get index() {
        return this.tag;
    }

    getFiles(): WSFile[] {
        return this.collector.fileList.filter(file => file.tags.contains(this.tag));
    }
}