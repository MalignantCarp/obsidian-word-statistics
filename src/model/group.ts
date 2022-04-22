import type { WSProjectManager } from "./manager";
import type { WSProject } from "./project";

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
        return JSON.stringify(this.toObject());
    }

    static fromSerialized(manager: WSProjectManager, serialized: string) {
        const grp: ReturnType<WSProjectGroup["toObject"]> = JSON.parse(serialized);

        let projects: WSProject[];
        grp.projects.forEach((gName => {
            if (manager.checkProjectName(gName)) {
                projects.push(manager.getProjectByName(gName));
            } else {
                manager.logError(`Tried to deserialize project ${gName}, but no such project found. (in WSProjectGroup.fromSerialized((${grp.name}))`);
                console.log(grp.projects);
            }
        }));
        return new WSProjectGroup(
            grp.name,
            projects
        );
    }

}