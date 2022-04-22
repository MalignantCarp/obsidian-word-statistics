import { WSDataCollector } from "./collector";
import { WSFile } from "./file";

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
        this.files = [];
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
        if (file instanceof WSFile) {
            this.file = file;
        } else {
            throw Error(`Tried to create WSFileProject '${name}' with null file.`);
        }
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
        if (this.file instanceof WSFile) {
            return this.file.path;
        }
        return null;
    }

    override getFiles(): WSFile[] {
        if (this.file instanceof WSFile) {
            // console.log(this.file);
            return this.file.getLinkedRefs();
        }
        return [];
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
        return this.collector.fileList.filter(file => file.path.startsWith(this.folder + "/"));
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
        return this.collector.fileList.filter(file => file.tags.contains(this.tag));
    }
}