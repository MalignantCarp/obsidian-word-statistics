import type { WSFile } from "./file";
import type { WSPath, WSProject } from "./project";

export namespace WSEvents {
    export namespace Focus {
        export const File = "ws-event-focus-file";
        export const Project = "ws-event-focus-project"; // we probably won't use this; the project will depend on the focused file
        export const FileItem = "ws-event-focus-file-item";
    }

    export namespace File {
        export const Opened = "ws-event-file-opened";
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
        export const FilesUpdated = "ws-event-project-files-updated";
        export const Updated = "ws-event-project-updated";
    }

    export namespace Path {
        export const Titled = "ws-event-path-titled";
        export const Cleared = "ws-event-path-deleted";
        export const Set = "ws-event-path-created";
        export const Updated = "ws-event-path-updated";
    }
}

type WSEventType = WSFocusEventType | WSFileEventType | WSProjectEventType | WSPathEventType;
export type WSFocusEventType = typeof WSEvents.Focus.File | typeof WSEvents.Focus.Project | typeof WSEvents.Focus.FileItem;
export type WSFileEventType = typeof WSEvents.File.Opened | typeof WSEvents.File.Created | typeof WSEvents.File.Renamed | typeof WSEvents.File.Deleted | typeof WSEvents.File.Updated | typeof WSEvents.File.WordsChanged;
export type WSProjectEventType = typeof WSEvents.Project.Renamed | typeof WSEvents.Project.Deleted | typeof WSEvents.Project.Created | typeof WSEvents.Project.FilesUpdated | typeof WSEvents.Project.Updated;
export type WSPathEventType = typeof WSEvents.Path.Titled | typeof WSEvents.Path.Set | typeof WSEvents.Path.Cleared | typeof WSEvents.Path.Updated;

interface WSEventInfo {
    type: WSEventType;
    data?: any[];
}

export interface WSFocusEventInfo extends WSEventInfo {
    type: WSFocusEventType;
    file?: WSFile;
    project?: WSProject;
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

export interface WSPathEventInfo extends WSEventInfo {
    type: WSPathEventType;
    path: WSPath;
    project?: WSProject;
}

export interface WSEventFilter {
    filter: WSFile | WSProject | WSPath;
    msg?: string;
}

export abstract class WSEvent {
    constructor(public info: WSEventInfo, public focus: WSEventFilter) {
    }
}

export class WSFocusEvent extends WSEvent {
    constructor(public info: WSFocusEventInfo, public focus: WSEventFilter) {
        super(info, focus);
    }
}

export class WSFileEvent extends WSEvent {
    constructor(public info: WSFileEventInfo, public focus: WSEventFilter) {
        super(info, focus);
    };
}

export class WSProjectEvent extends WSEvent {
    constructor(public info: WSProjectEventInfo, public focus: WSEventFilter) {
        super(info, focus);
    };
}

export class WSPathEvent extends WSEvent {
    constructor(public info: WSPathEventInfo, public focus: WSEventFilter) {
        super(info, focus);
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
        // console.log("Ping!", event.info.type, event.focus)
        this.callbacks.forEach(([cbRun, filter]) => {
            // console.log("Pong!", filter);
            if ((filter == null || filter == undefined) || (filter?.filter == null || filter?.filter == undefined) || filter?.filter == event.focus?.filter) {
                // console.log("Dispatching event.")
                cbRun(event);
            // } else {
            //     console.log("Ignoring event:", (filter == null || filter == undefined), (filter?.filter == null || filter?.filter == undefined), filter == event.focus);
            //     console.log("Focus: ", event.focus)
            //     console.log("Filter: ", filter?.filter)
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

    on(event: WSEventType, cbRun: Function, filter: WSEventFilter) {
        if (!this.events.has(event)) {
            this.events.set(event, new DispatcherEvent(event));
        }
        this.events.get(event).registerCallback(cbRun, filter);
    }

    off(event: WSEventType, cbRun: Function, filter: WSEventFilter) {
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
