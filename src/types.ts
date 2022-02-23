import { TFile } from "obsidian";

export interface PluginSettings {
	mySetting: string;
}

// export interface WCFileRef {
// 	id: number;
// 	path: string;
// 	words: number;
// 	lastUpdate: number;
// }

export class WCFileRef {
	private id: number;
	private path: string;
	private words: number;
	private lastUpdate: number;

	constructor(id: number, path: string) {
		this.id = id;
		this.path = path;
		this.words = 0;
		this.lastUpdate = Date.now();
	}

	setPath(newPath: string) {
		this.path = newPath;
		this.lastUpdate = Date.now();
	}

	getPath(): string {
		return this.path;
	}

	setWords(count: number) {
		this.words = count;
		this.lastUpdate = Date.now();
	}

	addWords(count: number) {
		this.words += count;
		this.lastUpdate = Date.now();
	}

	getWords(): number {
		return this.words;
	}

	getID(): number {
		return this.id;
	}

	getLastUpdate(): number {
		return this.lastUpdate;
	}
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
