import type { WSProjectManager } from "./manager";

export interface IPathV0 {
    path: string,
    title: string,
    wordGoalForPath: number,
    wordGoalForProjects: number,
    wordGoalForFiles: number,
    iconID: string;
}

export function SortPathList(paths: WSPath[]) {
    return paths.sort((a,b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
}

function LoadPathV0FromSerial(folderInfo: IPathV0): WSPath {
    let folder: WSPath;
    folder = new WSPath(folderInfo.path, folderInfo.title, folderInfo.wordGoalForPath, folderInfo.wordGoalForProjects, folderInfo.wordGoalForFiles, folderInfo.iconID);
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
        public path: string = "",
        public _title: string = "",
        public wordGoalForPath: number = 0,
        public wordGoalForProjects: number = 0,
        public wordGoalForFiles: number = 0,
        public iconID: string = "",
        private children: WSPath[] = []
    ) { }

    private toObject(): IPathV0 {
        return {
            path: this.path,
            title: this._title,
            wordGoalForPath: this.wordGoalForPath,
            wordGoalForProjects: this.wordGoalForProjects,
            wordGoalForFiles: this.wordGoalForFiles,
            iconID: ""
        };
    }

    serialize() {
        return this.toObject();
    }

    getPath(path: string) {
        if (path === this.path) {
            return this;
        }
        for (let child of this.children) {
            let currentPath: WSPath = child.getPath(path);
            if (currentPath instanceof WSPath) {
                return currentPath;
            }
        }
        return null;
    }

    findParentOfChild(path: WSPath): WSPath {
        if (path === this) {
            return null;
        }
        if (this.children.contains(path)) {
            return this;
        }
        for (let child of this.children) {
            if (child.children.contains(path)) {
                return child;
            }
        }
        return null;
    }

    getAll(): WSPath[] {
        let paths: WSPath[] = [];
        paths.push(this);
        this.children.forEach((child) => {
            paths.push(...child.getAll());
        })
        return SortPathList(paths);
    }

    addChild(child: WSPath) {
        if (!this.children.contains(child)) {
            this.children.push(child);
        }
    }

    removeChild(child: WSPath) {
        if (this.children.contains(child)) {
            this.children.remove(child);
        }
    }

    hasProjects(manager: WSProjectManager) {
        return manager.getProjectsByPath(this.path).length > 0;
    }

    hasDirectProjects(manager: WSProjectManager) {
        return manager.getProjectsByExactPath(this.path).length > 0;
    }

    hasChildren() {
        return this.children.length > 0;
    }

    hasChild(child: WSPath) {
        return this.children.contains(child);
    }

    isChildDescendent(child: WSPath) {
        let parent = this.findParentOfChild(child);
        // if we managed to find the children's parent from our path, then it is definitely a descendent
        return parent !== null;
    }

    getChildren(): WSPath[] {
        return this.children;
    }

    get defaultTitle(): string {
        let lastSlash = this.path.lastIndexOf("/") + 1
        if (lastSlash > 0) {
            return (this.path.slice(lastSlash));
        }
        return this.path;
    }

    get title(): string {
        if (this._title.length > 0) {
            return this._title;
        }
        let lastSlash = this.path.lastIndexOf("/") + 1
        if (lastSlash > 0) {
            return (this.path.slice(lastSlash));
        }
        return this.path;


    }

    set title(title: string) {
        this._title = title;
    }
}
