import { WSFile } from "./model/file";
import { WSProjectGroup } from "./model/group";
import { WSProject } from "./model/project";

export namespace WSEvents {
    export namespace File {
        export const Created = "ws-event-file-created";
        export const Renamed = "ws-event-file-renamed";
        export const Deleted = "ws-event-file-deleted";
        export const WordsChanged = "ws-event-file-words-changed";
    }

    export namespace Project {
        export const Renamed = "ws-event-project-renamed";
        export const Deleted = "ws-event-project-deleted";
        export const Created = "ws-event-project-created";
        export const FileAdded = "ws-event-project-file-added";
        export const FileDeleted = "ws-event-project-file-deleted";
    }

    export namespace Group {
        export const Renamed = "ws-event-group-renamed";
        export const Deleted = "ws-event-group-deleted";
        export const Created = "ws-event-group-created";
        export const ProjectAdded = "ws-event-group-project-added";
        export const ProjectDeleted = "ws-event-group-project-deleted";
    }
}

type WSEventType = WSFileEventType | WSProjectEventType | WSGroupEventType;
export type WSFileEventType = typeof WSEvents.File.Created | typeof WSEvents.File.Renamed | typeof WSEvents.File.Deleted | typeof WSEvents.File.WordsChanged;
export type WSProjectEventType = typeof WSEvents.Project.Renamed | typeof WSEvents.Project.Deleted | typeof WSEvents.Project.Created | typeof WSEvents.Project.FileAdded | typeof WSEvents.Project.FileDeleted;
export type WSGroupEventType = typeof WSEvents.Group.Renamed | typeof WSEvents.Group.Deleted | typeof WSEvents.Group.Created | typeof WSEvents.Group.ProjectAdded | typeof WSEvents.Group.ProjectDeleted;

interface WSEventInfo {
    type: WSEventType;
}

export interface WSFileEventInfo extends WSEventInfo {
    file: WSFile;
    words?: number;
}

export interface WSProjectEventInfo extends WSEventInfo {
    project: WSProject;
    file?: WSFile;
}

export interface WSGroupEventInfo extends WSEventInfo {
    group: WSProjectGroup;
    project?: WSProject;
}

export interface WSEventFilter {
    filter: WSFile | WSProject | WSProjectGroup;
}

class WSEvent {
    constructor(public evType: WSEventType, public info: WSEventInfo) {
        evType == WSEvents.File.Created;
    }
}

export class WSFileEvent extends WSEvent {
    constructor(public evType: WSFileEventType, public info: WSFileEventInfo) {
        super(evType, info);
    };
}

export class WSProjectEvent extends WSEvent {
    constructor(public evType: WSProjectEventType, public info: WSProjectEventInfo) {
        super(evType, info);
    };
}

export class WSProjectGroupEvent extends WSEvent {
    constructor(public evType: WSGroupEventType, public info: WSGroupEventInfo) {
        super(evType, info);
    };
}

/*

We want to take in two callbacks and one parameter:

filter: WSEventFilter - this will filter for a particular File/Project/Group
cb1: The callback to run when the event is triggered
cb2: The callback to run when we're cleaning up (i.e., tossing the Dispatcher)

*/

class DispatcherEvent {
    private callbacks: Function[] = [];

    constructor(private name: string) {

    }

    registerCallback(cb: Function) {
        this.callbacks.push(cb);
    }

    unregisterCallback(cb: Function) {
        this.callbacks.remove(cb);
    }

    fire(event: WSEvent) {
        this.callbacks.forEach((cb) => {
            cb(event);
        });
    }

    fireCleanup() {
        while (this.callbacks.length > 0) {
            this.callbacks.pop()(null);
        }
    }

    get isEmpty() {
        return this.callbacks.length === 0;
    }
}

export class Dispatcher {
    private events: Map<string, DispatcherEvent>;

    constructor() {
        this.events = new Map<string, DispatcherEvent>();
    }

    dispatch(event: string, data: WSEvent) {
        if (this.events.has(event)) {
            this.events.get(event).fire(data);
        }
    }

    on(event: string, cb: Function) {
        if (!this.events.has(event)) {
            this.events.set(event, new DispatcherEvent(event));
        }
        this.events.get(event).registerCallback(cb);
    }

    off(event: string, cb: Function) {
        if (this.events.has(event)) {
            this.events.get(event).unregisterCallback(cb);
        }
        if (this.events.get(event).isEmpty) {
            this.events.delete(event);
        }
    }

    cleanup() {
        this.events.forEach((event) => {
            event.fireCleanup();
        });
    }

}
