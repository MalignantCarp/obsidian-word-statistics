import type { WSProjectManager } from "./manager";
import type { WSProject } from "./project";

export interface IProjectGroupV0 {
    name: string;
    projects: string[];
}

function LoadProjectGroupV0FromSerial(manager: WSProjectManager, groupInfo: IProjectGroupV0): [boolean, WSProjectGroup] {
    let projects: WSProject[] = [];
    let error = false;
    if (!manager.checkProjectGroupName(groupInfo.name)) {
        console.log(`Error loading Project Group '${groupInfo.name}': Project Group with that name already exists.`);
        return [true, null];
    }
    groupInfo.projects.forEach((projName) => {
        if (manager.projects.has(projName)) {
            projects.push(manager.projects.get(projName)[1]);
        } else {
            console.log(`Error loading Project Group '${groupInfo.name}': Project '${projName}' does not exist.`);
            error = true;
        }
    });
    return [error, new WSProjectGroup(groupInfo.name, projects)];
}

export function LoadProjectGroupFromSerial(manager: WSProjectManager, groupInfo: IProjectGroupV0) : [boolean, WSProjectGroup] {
    return LoadProjectGroupV0FromSerial(manager, groupInfo);
}

export class WSProjectGroup {
    name: string;
    projects: WSProject[];

    constructor(name: string, projects?: WSProject[]) {
        this.name = name;
        this.projects = projects || [];
    };

    private toObject() {
        let projList: string[] = [];
        this.projects.forEach((proj: WSProject) => {
            projList.push(proj.name);
        });
        return { name: this.name, projects: projList };
    }

    serialize() {
        return JSON.stringify(this.toObject(), null, '\t');
    }
}