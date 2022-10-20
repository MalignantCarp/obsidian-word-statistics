import type { WSFile } from "./file";
import type { WSFolder } from "./folder";

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

export namespace WSEvents {

    export const dispatcher = new Dispatcher();

    export namespace Data {
        export const File = "ws-event-data-file";
        export const Folder = "ws-event-data-folder";
    }

    export namespace Focus {
        export const File = "ws-event-focus-file";
    }

    export namespace Setting {
        export const Recording = "ws-event-settings-recording";
        export const StatusBar = "ws-event-settings-statusbar";
    }

    export namespace File {
        export const Created = "ws-event-file-created";
        export const Renamed = "ws-event-file-renamed";
        export const Deleted = "ws-event-file-deleted";
        export const WordsChanged = "ws-event-file-words-changed";
        export const GoalSet = "ws-event-file-goal-set";
        export const TitleSet = "ws-event-file-title-set";
    }

    export namespace Folder {
        export const Created = "ws-event-folder-created";
        export const Renamed = "ws-event-folder-renamed";
        export const Deleted = "ws-event-folder-deleted";
        export const WordsChanged = "ws-event-folder-words-changed";
        export const GoalSet = "ws-event-folder-goal-set";
        export const TitleSet = "ws-event-folder-title-set";
        export const RecordingSet = "ws-event-folder-recording-set";
    }
}

type WSEventType = WSDataEventType | WSFocusEventType | WSFileEventType | WSFolderEventType | WSSettingEventType;
export type WSDataEventType = typeof WSEvents.Data.File | typeof WSEvents.Data.Folder;
export type WSFocusEventType = typeof WSEvents.Focus.File;
export type WSFileEventType = typeof WSEvents.File.Created | typeof WSEvents.File.Renamed | typeof WSEvents.File.Deleted | typeof WSEvents.File.WordsChanged | typeof WSEvents.File.GoalSet | typeof WSEvents.File.TitleSet;
export type WSFolderEventType = typeof WSEvents.Folder.Created | typeof WSEvents.Folder.Renamed | typeof WSEvents.Folder.Deleted | typeof WSEvents.Folder.WordsChanged  | typeof WSEvents.Folder.GoalSet | typeof WSEvents.Folder.TitleSet | typeof WSEvents.Folder.RecordingSet;
export type WSSettingEventType = typeof WSEvents.Setting.Recording | typeof WSEvents.Setting.StatusBar;

interface WSEventInfo {
    type: WSEventType;
    data?: any[];
}

export interface WSSettingEventInfo extends WSEventInfo {
    type: WSSettingEventType;
    data?: any[];
}

export interface WSDataEventInfo extends WSEventInfo {
    type: WSDataEventType;
}

export interface WSFocusEventInfo extends WSEventInfo {
    type: WSFocusEventType;
    file: WSFile;
}

export interface WSFileEventInfo extends WSEventInfo {
    type: WSFileEventType;
    file: WSFile;
    words?: number;
}

export interface WSFolderEventInfo extends WSEventInfo {
    type: WSFolderEventType;
    folder: WSFolder;
}

export interface WSEventFilter {
    filter: WSFile | WSFolder;
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

export class WSSettingEvent extends WSEvent {
    constructor(public info: WSSettingEventInfo, public focus: WSEventFilter) {
        super(info, focus);
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

export class WSFolderEvent extends WSEvent {
    constructor(public info: WSFolderEventInfo, public focus: WSEventFilter) {
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