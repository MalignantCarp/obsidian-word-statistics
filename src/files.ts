export class WSFileRef {
	private id: number;
	private path: string;
	private words: number;
	private lastUpdate: number;
	private title: string;
	private tags: string[];
	private links: Map<WSFileRef, string>;

	constructor(id: number, path: string) {
		this.id = id;
		this.path = path;
		this.words = 0;
		this.lastUpdate = Date.now();
		this.title = null;
		this.tags = [];
		this.links = new Map<WSFileRef, string>();
	}

	clearTags() {
		while (this.tags.length > 0) {
			this.tags.pop();
		}
	}

	addTag(tag: string) {
		if (!this.tags.contains(tag)) {
			this.tags.push(tag);
		}
	}

	setTags(tags: string[]) {
		this.tags = tags;
	}

	getTags() {
		return this.tags;
	}

	hasTag(tag: string) {
		return this.tags.contains(tag);
	}

	clearLinks() {
		this.links.clear();
	}

	setLink(file: WSFileRef, title: string) {
		this.links.set(file, title);
	}

	hasLink(file: WSFileRef) {
		return this.links.has(file);
	}

	removeLink(file: WSFileRef) {
		if (this.links.has(file)) {
			this.links.delete(file);
		} else {
			console.log("Tried to remove link to '%s' from WSFileRef(%s), but it is not there.", file.path, this.path);
		}
	}

	getLinkTitle(file: WSFileRef) {
		return this.links.get(file);
	}

	getLinkedRefs() {
		return Array.from(this.links.keys());
	}

	getLinks() {
		return this.links;
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