import { WSProject } from "./projects";

export const YAML_PROJECT_INDEX = 'wsplugin-project-index'; // set this to the name of the project this note is the index of

export interface WSPluginSettings {
	useDisplayText: boolean;
}

export interface WSTableSettings {
	showNumber: boolean; // shows a number next to each entry as the primary key
	sortAlpha: boolean; // sorts all entries alphabetically -- ignores index sort
	showShare: boolean; // shorts the percentage of words the note holds of the project's total word count
	showExcluded: boolean; // still shows an file in the table where counting is to be excluded 
	project: WSProject;
}

export enum QIType {
	Log = "QIT_LOG",
	Delta = "QIT_DELTA"
}

export class QueuedItem {
	private type: QIType;
	private id: number;
	private path: string;
	private count: number;

	constructor(type: QIType, id: number, path: string, count: number) {
		this.type = type;
		this.id = id;
		this.path = path;
		this.count = count;
	}

	getType() {
		return this.type;
	}

	getID() {
		return this.id;
	}

	getPath() {
		return this.path;
	}

	getCount() {
		return this.count;
	}
}
