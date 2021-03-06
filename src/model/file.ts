export class WSFile {
	name: string;
	path: string;
	private currentWords: number;
	private startWords: number;
	lastUpdate: number;
	private ftitle: string;
	tags: string[];
	links: Map<WSFile, string>;
	backlinks: WSFile[];
	wordGoal: number;

	constructor(name: string, path: string, wordGoal?: number) {
		this.name = name;
		this.path = path;
		this.startWords = 0;
		this.currentWords = 0;
		this.lastUpdate = Date.now();
		this.ftitle = null;
		this.tags = [];
		this.links = new Map<WSFile, string>();
		this.backlinks = [];
		this.wordGoal = wordGoal || 0;
		// console.log(`New File(${this.path}`);
	}

	private toObject() {
		return ({
			name: this.name,
			path: this.path,
			words: this.currentWords,
			lastUpdate: this.lastUpdate,
			wordGoal: this.wordGoal
		});
	}

	serialize() {
		return this.toObject();
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
		while (this.tags.length > 0) {
			this.tags.pop();
		}
		this.tags = tags;
	}

	hasTag(tag: string) {
		return this.tags.contains(tag);
	}

	clearLinks() {
		this.links.forEach((name: string, file: WSFile) => {
			file.removeBacklink(this);
		});
		this.links.clear();
	}

	setLink(file: WSFile, title: string) {
		this.links.set(file, title);
		file.setBacklink(this);
	}

	setBacklink(file: WSFile) {
		if (!this.backlinks.contains(file)) {
			this.backlinks.push(this);
		}
	}

	hasBacklink(file: WSFile) {
		return (this.backlinks.contains(file));
	}

	removeBacklink(file: WSFile) {
		if (this.backlinks.contains(file)) {
			this.backlinks.remove(file);
		}
	}

	hasLink(file: WSFile) {
		return this.links.has(file);
	}

	removeLink(file: WSFile) {
		if (this.links.has(file)) {
			this.links.delete(file);
			file.removeBacklink(this);
		} else {
			console.log("Tried to remove link to '%s' from WSFileRef(%s), but it is not there.", file.path, this.path);
		}
	}

	getLinkTitle(file: WSFile) {
		return this.links.get(file);
	}

	getLinkedRefs() {
		return Array.from(this.links.keys());
	}

	setTitle(newTitle: string) {
		if (newTitle == "" || newTitle == undefined || newTitle == null) {
			this.ftitle = null;
		} else {
			this.ftitle = newTitle;
		}
	}

	get title() {
		if (this.ftitle == "" || this.ftitle == null) {
			//let title = this.path.split("/").pop().replace(/\.md$/, "");
			//return title;
			return this.name;
		}
		return this.ftitle;
	}

	hasTitle() {
		return this.ftitle != null;
	}

	setPath(newPath: string) {
		this.path = newPath;
		this.lastUpdate = Date.now();
	}

	set words(count: number) {
		this.currentWords = count;
		this.lastUpdate = Date.now();
	}

	addWords(count: number) {
		this.currentWords += count;
		this.lastUpdate = Date.now();
	}

	getStartWords() {
		return this.startWords;
	}

	setStartWords(words: number) {
		this.startWords = words;
	}

	get words() {
		return this.currentWords;
	}

	get totalWords() {
		return this.currentWords;
	}
}