import { WSDataCollector } from "./data";

export class WSFileRef {
	private collector: WSDataCollector;
	private id: number;
	private path: string;
	private words: number;
	private lastUpdate: number;
	private title: string;

	constructor(collector: WSDataCollector, id: number, path: string) {
		this.collector = collector;
		this.id = id;
		this.path = path;
		this.words = 0;
		this.lastUpdate = Date.now();
		this.title = null;
	}

	setTitle(newTitle: string) {
		if (newTitle == "" || newTitle == undefined || newTitle == null) {
			this.title = null;
		} else {
			this.title = newTitle;
		}
	}

	getTitle() {
		if (this.title == "" || this.title == null) {
			let title = this.path.split("/").pop().replace(/\.md$/, "");
			return title;
		}
		return this.title;
	}

	hasTitle() {
		return this.title != null;
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