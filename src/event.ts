import type { WSFile } from "./model/file";
import type { WSProjectGroup } from "./model/group";
import type { WSProject } from "./model/project";

export namespace WSEvents {
    export namespace File {
        export const Created = "ws-event-file-created";
        export const Renamed = "ws-event-file-renamed";
        export const Deleted = "ws-event-file-deleted";
        export const Updated = "ws-event-file-updated";
        export const WordsChanged = "ws-event-file-words-changed";
    }

    export namespace Project {
        export const Renamed = "ws-event-project-renamed";
        export const Deleted = "ws-event-project-deleted";
        export const Created = "ws-event-project-created";
        export const FileAdded = "ws-event-project-file-added";
        export const FileDeleted = "ws-event-project-file-deleted";
        export const Updated = "ws-event-project-updated";
    }

    export namespace Group {
        export const Renamed = "ws-event-group-renamed";
        export const Deleted = "ws-event-group-deleted";
        export const Created = "ws-event-group-created";
        export const ProjectAdded = "ws-event-group-project-added";
        export const ProjectDeleted = "ws-event-group-project-deleted";
        export const Updated = "ws-event-group-updated";
    }
}

type WSEventType = WSFileEventType | WSProjectEventType | WSGroupEventType;
export type WSFileEventType = typeof WSEvents.File.Created | typeof WSEvents.File.Renamed | typeof WSEvents.File.Deleted | typeof WSEvents.File.Updated | typeof WSEvents.File.WordsChanged;
export type WSProjectEventType = typeof WSEvents.Project.Renamed | typeof WSEvents.Project.Deleted | typeof WSEvents.Project.Created | typeof WSEvents.Project.FileAdded | typeof WSEvents.Project.FileDeleted | typeof WSEvents.Project.Updated;
export type WSGroupEventType = typeof WSEvents.Group.Renamed | typeof WSEvents.Group.Deleted | typeof WSEvents.Group.Created | typeof WSEvents.Group.ProjectAdded | typeof WSEvents.Group.ProjectDeleted | typeof WSEvents.Group.Updated;

interface WSEventInfo {
    type: WSEventType;
}

export interface WSFileEventInfo extends WSEventInfo {
    type: WSFileEventType;
    file: WSFile;
    words?: number;
}

export interface WSProjectEventInfo extends WSEventInfo {
    type: WSProjectEventType;
    project: WSProject;
    file?: WSFile;
}

export interface WSGroupEventInfo extends WSEventInfo {
    type: WSGroupEventType;
    group: WSProjectGroup;
    project?: WSProject;
}

export interface WSEventFilter {
    filter: WSFile | WSProject | WSProjectGroup;
}

export abstract class WSEvent {
    constructor(public info: WSEventInfo, public filter?: WSEventFilter) {
    }
}

export class WSFileEvent extends WSEvent {
    constructor(public info: WSFileEventInfo, public filter?: WSEventFilter) {
        super(info, filter);
    };
}

export class WSProjectEvent extends WSEvent {
    constructor(public info: WSProjectEventInfo, public filter?: WSEventFilter) {
        super(info, filter);
    };
}

export class WSProjectGroupEvent extends WSEvent {
    constructor(public info: WSGroupEventInfo, public filter?: WSEventFilter) {
        super(info, filter);
    };
}

class DispatcherEvent {
    private callbacks: [Function, WSEventFilter][] = [];

    constructor(private name: string) {
    }

    registerCallback(cbRun: Function, filter?: WSEventFilter) {
        this.callbacks.push([cbRun, filter]);
    }

    unregisterCallback(cbRun: Function, filter?: WSEventFilter) {
        this.callbacks.remove([cbRun, filter]);
    }

    fire(event: WSEvent) {
        this.callbacks.forEach(([cbRun, filter]) => {
            if (filter != null || filter != undefined || filter == event.filter) {
                cbRun(event);
            }
        });
    }

    fireCleanup() {
        while (this.callbacks.length > 0) {
            this.callbacks.pop();
        }
    }

    get isEmpty() {
        return this.callbacks.length === 0;
    }
}

export class Dispatcher {
    private events: Map<WSEventType, DispatcherEvent>;

    constructor() {
        this.events = new Map<WSEventType, DispatcherEvent>();
    }

    trigger(event: WSEvent) {
        if (this.events.has(event.info.type)) {
            this.events.get(event.info.type).fire(event);
        }
    }

    on(event: WSEventType, cbRun: Function, filter?: WSEventFilter) {
        if (!this.events.has(event)) {
            this.events.set(event, new DispatcherEvent(event));
        }
        this.events.get(event).registerCallback(cbRun, filter);
    }

    off(event: WSEventType, cbRun: Function, filter?: WSEventFilter) {
        if (this.events.has(event)) {
            this.events.get(event).unregisterCallback(cbRun, filter);
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
