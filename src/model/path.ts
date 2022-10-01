import type { WSProjectManager } from "./manager";

export function SortPathList(paths: WSPath[]) {
    return paths.sort((a, b) => a.path.localeCompare(b.path, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
}

export class WSPath {
    constructor(
        public path: string = "",
        public _title: string = "",
        public wordGoalForPath: number = 0,
        public wordGoalForProjects: number = 0,
        public wordGoalForFiles: number = 0,
        public iconID: string = "",
        private children: WSPath[] = [],
    ) { }

    samePathAs(path: WSPath) {
        return path.path === this.path;
    }

    sameObjAs(path: WSPath) {
        return path === this;
    }

    copyFrom(path: WSPath) {
        this.path = path.path;
        this._title = path._title;
        this.wordGoalForFiles = path.wordGoalForFiles;
        this.wordGoalForProjects = path.wordGoalForProjects;
        this.wordGoalForPath = path.wordGoalForPath;
        this.iconID = path.iconID;
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
        // console.log(`Finding parent of child (${path.path}) from (${this.path}). Current children:`);
        // this.children.forEach((child) => {
        //     console.log(child.path);
        // });
        // console.log("--");
        if (path === this) {
            return null;
        }
        if (this.children.contains(path)) {
            // console.log(this.path, " is parent.");
            return this;
        }
        for (let child of this.children) {
            let parent = child.findParentOfChild(path);
            if (parent instanceof WSPath) {
                return (parent);
            }
        }
        return null;
    }

    getAncestors(path: WSPath): WSPath[] {
        let ancestors: WSPath[] = [];
        let descendent: WSPath;
        // console.log(path.path);
        if (path === this) {
            return ancestors;
        }
        if (this.children.contains(path)) {
            // console.log(this.path, " is parent.");
            return [this];
        }
        descendent = this;
        while (descendent instanceof WSPath) {
            if (descendent.children.length === 0) break;
            for (let child of descendent.children) {
                // console.log(path.path, child.path);
                if (path.path.startsWith(child.path)) {
                    ancestors.push(child);
                    descendent = child;
                    break;
                }
            }
            if (ancestors.last() !== descendent) break;
        }
        return ancestors;
    }

    getAll(): WSPath[] {
        let paths: WSPath[] = [];
        paths.push(this);
        this.children.forEach((child) => {
            paths.push(...child.getAll());
        });
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
        let lastSlash = this.path.lastIndexOf("/") + 1;
        if (lastSlash > 0) {
            return (this.path.slice(lastSlash));
        }
        return this.path;
    }

    get title(): string {
        if (this._title.length > 0) {
            return this._title;
        }
        let lastSlash = this.path.lastIndexOf("/") + 1;
        if (lastSlash > 0) {
            return (this.path.slice(lastSlash));
        }
        return this.path;


    }

    set title(title: string) {
        this._title = title;
    }
}
