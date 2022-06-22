import type { WSFile } from "./file";
import type { WSProject } from "./project";
import type { WSPath } from "./path";

export namespace WSEvents {
    export namespace Data {
        export const File = "ws-event-data-file";
        export const Project = "ws-event-data-project";
        export const Path = "ws-event-data-path";
    }

    export namespace Focus {
        export const File = "ws-event-focus-file";
        export const Project = "ws-event-focus-project"; // we probably won't use this; the project will depend on the focused file
        export const FileItem = "ws-event-focus-file-item";
    }

    export namespace File {
        export const Created = "ws-event-file-created";
        export const Renamed = "ws-event-file-renamed";
        export const Deleted = "ws-event-file-deleted";
        export const Updated = "ws-event-file-updated";
        export const WordsChanged = "ws-event-file-words-changed";
        export const GoalsSet = "ws-event-file-goals-set";
    }

    export namespace Project {
        export const Renamed = "ws-event-project-renamed";
        export const Deleted = "ws-event-project-deleted";
        export const Created = "ws-event-project-created";
        export const FilesUpdated = "ws-event-project-files-updated";
        export const Updated = "ws-event-project-updated";
        export const PathSet = "ws-event-project-path-set";
        export const GoalsSet = "ws-event-project-goals-set";
        export const IndexSet = "ws-event-project-index-set";
        export const CategorySet = "ws-event-project-category-set";
        export const TitleSet = "ws-event-project-title-set";
    }

    export namespace Path {
        export const Titled = "ws-event-path-titled";
        export const Deleted = "ws-event-path-deleted";
        export const Created = "ws-event-path-created";
        export const Updated = "ws-event-path-updated";
        export const Cleared = "ws-event-path-cleared";
        export const Set = "ws-event-path-set";
        export const GoalsSet = "ws-eventpath-goals-set";
    }
}

type WSEventType = WSDataEventType | WSFocusEventType | WSFileEventType | WSProjectEventType | WSPathEventType;
export type WSDataEventType = typeof WSEvents.Data.File | typeof WSEvents.Data.Project | typeof WSEvents.Data.Path;
export type WSFocusEventType = typeof WSEvents.Focus.File | typeof WSEvents.Focus.Project | typeof WSEvents.Focus.FileItem;
export type WSFileEventType = typeof WSEvents.File.Created | typeof WSEvents.File.Renamed | typeof WSEvents.File.Deleted | typeof WSEvents.File.Updated | typeof WSEvents.File.WordsChanged | typeof WSEvents.File.GoalsSet;
export type WSProjectEventType = typeof WSEvents.Project.Renamed | typeof WSEvents.Project.Deleted | typeof WSEvents.Project.Created | typeof WSEvents.Project.FilesUpdated | typeof WSEvents.Project.Updated | typeof WSEvents.Project.PathSet | typeof WSEvents.Project.GoalsSet | typeof WSEvents.Project.IndexSet | typeof WSEvents.Project.CategorySet | typeof WSEvents.Project.TitleSet;
export type WSPathEventType = typeof WSEvents.Path.Titled | typeof WSEvents.Path.Set | typeof WSEvents.Path.Cleared | typeof WSEvents.Path.Updated | typeof WSEvents.Path.Created | typeof WSEvents.Path.Deleted | typeof WSEvents.Path.GoalsSet;

interface WSEventInfo {
    type: WSEventType;
    data?: any[];
}

export interface WSDataEventInfo extends WSEventInfo {
    type: WSDataEventType;
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
    constructor(public info: WSEventInfo, public focus: WSEventFilter, private stop: boolean = false) {
    }

    stopPropagation() {
        this.stop = true;
    }

    get stopped() {
        return this.stop;
    }
}

export class WSDataEvent extends WSEvent {
    constructor(public info: WSDataEventInfo, public focus: WSEventFilter) {
        super(info, focus);
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
        // console.log("Callback unregistered. ", this.name)
        this.callbacks.remove([cbRun, filter]);
    }

    fire(event: WSEvent) {
        // console.log("Ping!", this.name, event.info.type, event.focus);
        this.callbacks.forEach(([cbRun, filter]) => {
            // console.log("Pong!", filter);
            if (event.stopped) {
                return;
            }
            if ((filter == null || filter == undefined) || (filter?.filter == null || filter?.filter == undefined) || filter?.filter == event.focus?.filter) {
                // console.log("Dispatching event.");
                cbRun(event);
                // console.log("Event dispatched.");
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
        if (event instanceof WSFileEvent) {
            this.trigger(new WSDataEvent({ type: WSEvents.Data.File }, { filter: null }));
        } else if (event instanceof WSProjectEvent) {
            this.trigger(new WSDataEvent({ type: WSEvents.Data.Project }, { filter: null }));
        } else if (event instanceof WSPathEvent) {
            this.trigger(new WSDataEvent({ type: WSEvents.Data.Path }, { filter: null }));
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
