export interface PluginSettings {
	mySetting: string;
}

export class WSProject {
	private name: string;
	private files: WSFileRef[];

	constructor(name: string) {
		this.name = name;
		this.files = [];
	}

	addFile(file: WSFileRef) {
		if (!this.files.contains(file)) {
			this.files.push(file);
		} else {
			console.log("Tried to add WSFileRef(%d)[%s] to project '%s', but it was already in file list.", file.getID(), file.getPath(), this.name);
		}
	}

	hasFile(file: WSFileRef) {
		return (this.files.contains(file));
	}

	deleteFile(file: WSFileRef) {
		if (this.files.contains(file)) {
			this.files.remove(file);
		} else {
			console.log("Tried to remove WSFileRef(%d)[%s] from project '%s', but it was not there.", file.getID(), file.getPath(), this.name);
		}
	}
}


export class WSFileRef {
	private id: number;
	private path: string;
	private words: number;
	private lastUpdate: number;
	private title: string;
	private project: WSProject;
	private projectIndex: boolean = false;
	private projectExcludeCount: boolean = false;
	private backlinks: Map<number, WSProject>;
	private links: WSFileRef[];

	constructor(id: number, path: string) {
		this.id = id;
		this.path = path;
		this.words = 0;
		this.lastUpdate = Date.now();
		this.backlinks = new Map<number, WSProject>();
		this.links = [];
	}

	addLink(link: WSFileRef) {
		this.links.push(link);
	}

	removeLink(link: WSFileRef) {
		this.links.remove(link);
	}

	getLinks(): WSFileRef[] {
		return this.links;
	}

	hasLinks() {
		return this.links.length > 0;
	}

	clearLinks() {
		this.links.length = 0;
	}

	clearBacklinks() {
		this.backlinks.clear();
	}

	setBacklink(id: number, proj: WSProject) {
		this.backlinks.set(id, proj);
	}

	getBacklink(id: number) {
		if (this.backlinks.has(id)) {
			return this.backlinks.get(id);
		}
		return null;
	}

	getBacklinks() {
		return this.backlinks;
	}

	getBacklinkedIDs() {
		return Array.from(this.backlinks.keys());
	}

	getBacklinkedProjects() {
		return Array.from(this.backlinks.values());
	}

	hasBacklinks() {
		return (this.backlinks.size > 0);
	}

	hasBacklink(id: number) {
		return this.backlinks.has(id);
	}

	removeBacklink(id: number) {
		this.backlinks.delete(id);
	}

	setTitle(newTitle: string) {
		this.title = newTitle;
	}

	getTitle() {
		return this.title;
	}

	setProject(proj: WSProject) {
		this.project = proj;
	}

	getProject() {
		return this.project;
	}

	hasProject() {
		return (this.project != undefined && this.project != null);
	}

	setProjectIndex(isIndex: boolean) {
		this.projectIndex = isIndex;
	}

	isProjectIndex() {
		return this.projectIndex;
	}

	setProjectExclusion(exclude: boolean) {
		this.projectExcludeCount = exclude;
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
