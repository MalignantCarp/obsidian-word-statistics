import { Collector } from "./data";

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

export class WSProject {
	private name: string;
	private files: WSFileRef[];

	constructor(name: string) {
		this.name = name;
		this.files = [];
	}

	getName() {
		return this.name;
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
		return (this.files.length > 0);
	}

	getFileList() {
		return this.files;
	}

    getAllFiles(): WSFileRef[] {
        let files: WSFileRef[] = []

        let pFiles = this.files;

        for (let i = 0; i < pFiles.length; i ++) {
            let file = pFiles[i];
            files.push(file);
            if (file.isProjectIndex()) {
                let links = file.getLinks();
                for (let j = 0; j < links.length; j++) {
                    let link = links[j];
                    files.push(link);
                }
            }
        }
        return files;
    }
}


export class WSFileRef {
	private collector: Collector;
	private id: number;
	private path: string;
	private words: number;
	private lastUpdate: number;
	private title: string;
	private project: WSProject;
	private projectIndex: boolean = false;
	private projectExcludeCount: boolean = false;
	private backlinks: Map<number, WSProject>;
	private backlinkNames: Map<number, string>;
	private links: WSFileRef[];

	constructor(collector: Collector, id: number, path: string) {
		this.collector = collector;
		this.id = id;
		this.path = path;
		this.words = 0;
		this.lastUpdate = Date.now();
		this.title = null;
		this.project = null;
		this.projectIndex = false;
		this.projectExcludeCount = false;
		this.backlinks = new Map<number, WSProject>();
		this.backlinkNames = new Map<number, string>();
		this.links = [];
	}

	addLink(link: WSFileRef, title: string) {
		if (this.links.contains(link)) {
			console.log("Tried to add link from WSFileRef(%d, %s) to WSFileRef(%d, %s), but a link already exists.", this.id, this.path, link.id, link.path);
			return;
		}
		this.links.push(link);
		link.setBacklink(this.id, this.project, title);
	}

	removeLink(link: WSFileRef) {
		if (this.links.contains(link)) {
			this.links.remove(link);
			link.removeBacklink(this.id);
		} else {
			console.log("Tried to remove a link from WSFileRef(%d, %s) to WSFileRef(%d, %s), but no such link exists.", this.id, this.path, link.id, link.path);
		}
	}

	getLinks(): WSFileRef[] {
		return this.links;
	}

	hasLinks() {
		return this.links.length > 0;
	}

	isLinkedTo(link: WSFileRef) {
		return this.links.contains(link);
	}

	clearLinks() {
		while (this.links.length > 0) {
			let link = this.links.pop();
			link.removeBacklink(this.id);
		}
	}

	clearBacklinks() {
		this.backlinks.clear();
		this.backlinkNames.clear();
	}

	setBacklink(id: number, proj: WSProject, title: string) {
		this.backlinks.set(id, proj);
		this.backlinkNames.set(id, title);
	}

	getBacklink(id: number) {
		if (this.backlinks.has(id)) {
			return this.backlinks.get(id);
		}
		return null;
	}

	getBacklinkTitle(id: number) {
		// if we have not specifically ascribed a title to this backlink, just return the normal title
		// which will be the title field or the filename
		if (this.backlinks.has(id)) {
			return this.backlinkNames.get(id);
		}
		return this.getTitle();
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

	hasBacklinkTo(id: number) {
		return this.backlinks.has(id);
	}

	removeBacklink(id: number) {
		this.backlinks.delete(id);
		this.backlinkNames.delete(id);
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

	setProject(proj: WSProject) {
		if (proj == undefined) {
			proj = null;
		}
		// If we are changing projects (and our project isn't null)
		if (this.project != proj && this.project != null) {
			// If we are an index, we need to clear all existing links
			if (this.isProjectIndex()) {
				this.clearLinks();
			}
			// Remove this file from existing project.
			this.project.deleteFile(this);
		}
		// If we are changing to a non-null project
		if (this.project != proj && proj != null) {
			// Add this file to the project.
			proj.addFile(this);
		}
		this.project = proj;
	}

	private linksEqual(oldLinks: WSFileRef[], newLinks: [WSFileRef, string][]) {
		// if the lengths are not equal, the links are not equal and we are done here
		if (oldLinks.length === newLinks.length) {
			// if the link lengths are equal, we need to search through the links until we find a non-match or the end
			for (let i = 0; i < oldLinks.length; i++) {
				if (oldLinks[i] != newLinks[i][0]) {
					return false;
				}
			}
			// if we have reached the end without finding a non-match, we are equal
			return true;
		}
		return false;
	}

	updateLinks() {
		let mdCache = this.collector.getMetadataCache();
		if (this.isProjectIndex()) {
			let oldLinks = this.getLinks();
			let newLinks: [WSFileRef, string][] = [];
			let links = mdCache.getCache(this.path).links;
			if (links != undefined) {
				for (let i = 0; i < links.length; i++) {
					let linkName = links[i].link;
					let title = links[i].displayText;
					let dest = mdCache.getFirstLinkpathDest(linkName, this.path);
					newLinks.push([this.collector.getFile(dest.path), title]);
				}
			}
			// if our two lists of links are not the same, we need to reset
			if (!this.linksEqual(oldLinks, newLinks)) {
				this.clearLinks();
				for (let i = 0; i < newLinks.length; i++) {
					let [link, title] = newLinks[i];
					this.addLink(link, title);
				}
			}
		} else if (this.hasLinks()) {
			// this is not an index, so does not need links
			this.clearLinks();
		}
	}

	getProject() {
		return this.project;
	}

	hasProject() {
		return this.project != null;
	}

	setProjectIndex(isIndex: boolean) {
		if (isIndex == undefined || isIndex == null) {
			isIndex = false;
		}
		this.projectIndex = isIndex;
		this.updateLinks();
	}

	isProjectIndex() {
		return this.projectIndex;
	}

	setProjectExclusion(exclude: boolean) {
		if (exclude == null || exclude == undefined) {
			exclude = false;
		}
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
