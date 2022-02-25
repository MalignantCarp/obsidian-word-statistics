export interface PluginSettings {
	mySetting: string;
}

export class WSProject {
	private name: string;
	private files: string[];

	constructor(name: string) {
		this.name = name;
		this.files = [];
	}

	addFile(path: string) {
		if (!this.files.contains(path)) {
			this.files.push(path);
		} else {
			console.log("Tried to add path '%s' to project '%s', but it was already in path list.", path, this.name);
		}
	}

	hasFile(path: string) {
		return (this.files.contains(path));
	}

	deleteFile(path: string) {
		if (this.files.contains(path)) {
			this.files.remove(path);
		} else {
			console.log("Tried to remove path '%s' from project '%s', but it was not there.", path, this.name);
		}
	}
}


export class WSFileRef {
	private id: number;
	private path: string;
	private words: number;
	private lastUpdate: number;
	private title: string;
	private projectName: string;
	private projectIndex: boolean = false;
	private projectExcludeCount: boolean = false;

	constructor(id: number, path: string) {
		this.id = id;
		this.path = path;
		this.words = 0;
		this.lastUpdate = Date.now();
	}

	setTitle(newTitle: string) {
		this.title = newTitle;
	}

	getTitle() {
		return this.title;
	}

	setProjectName(newName: string) {
		this.projectName = newName;
	}

	getProjectName() {
		return this.projectName;
	}

	setProjectIndex(isIndex: boolean) {
		this.projectIndex = isIndex;
	}

	isProjectIndex() {
		return this.projectIndex;
	}

	setProjectExclusion(exclude: boolean) {
		this.projectExcludeCount = exclude
	}

	isCountExcludedFromProject() {
		return this.projectExcludeCount;
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
