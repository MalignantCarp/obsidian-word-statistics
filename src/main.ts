import { App, debounce, Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, MetadataCache, Vault, MarkdownPreviewView, TAbstractFile, Notice, CachedMetadata, normalizePath, TFolder } from 'obsidian';
import { WSDataCollector } from './data';
import WordStatsSettingTab, { DEFAULT_PLUGIN_SETTINGS, DEFAULT_TABLE_SETTINGS } from './settings';
import ProjectTableModal, { BuildProjectTable } from './tables';
import { WSPluginSettings } from './settings';
import { WordCountForText } from './words';
import { WSProject } from './projects';
import { WSFile } from './files';

const PROJECT_PATH = "projects.json";

declare module "obsidian" {
	interface Workspace {
		on(
			name: "word-statistics-project-update",
			callback: (project: WSProject) => any
		): EventRef;
		on(
			name: "word-statistics-project-files-update",
			callback: (project: WSProject) => any
		): EventRef;

		trigger(name: "word-statistics-project-update", project: WSProject): void;
		trigger(name: "word-statistics-project-files-update", project: WSProject): void;
	}
}

export default class WordStatisticsPlugin extends Plugin {
	public settings: WSPluginSettings;
	public debounceRunCount: Debouncer<[file: TFile, data: string]>;
	public wordsPerMS: number[] = [];
	private statusBar: HTMLElement;
	private collector: WSDataCollector;
	private hudLastUpdate: number = 0;
	initialScan: boolean = false;

	async onload() {
		console.log("Obsidian Word Statistics.onload()");
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));
		this.collector = new WSDataCollector(this, this.app.vault, this.app.metadataCache);
		let projects = await this.loadSerialData(PROJECT_PATH);
		if (projects) {
			this.collector.manager.populateFromSerialized(projects);
		}

		this.debounceRunCount = debounce(
			(file: TFile, data: string) => this.RunCount(file, data),
			200,
			false
		);
		// there has to be a better event to hook onto here, this seems silly
		this.registerEvent(this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this)));
		this.registerEvent(this.app.workspace.on("active-leaf-change", this.onLeafChange.bind(this)));
		this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen.bind(this)));

		this.registerEvent(this.app.vault.on("delete", this.onFileDelete.bind(this)));
		this.registerEvent(this.app.vault.on("rename", this.onFileRename.bind(this)));

		// this.registerEvent(this.app.metadataCache.on("changed", this.onMDChanged.bind(this)));
		this.registerEvent(this.app.metadataCache.on("resolve", this.onMDResolve.bind(this)));

		this.registerInterval(window.setInterval(this.onInterval.bind(this), 500));

		// custom events
		this.registerEvent(this.app.workspace.on("word-statistics-project-update", this.onProjectUpdate.bind(this)));
		this.registerEvent(this.app.workspace.on("word-statistics-project-files-update", this.onProjectFilesUpdate.bind(this)));

		this.statusBar = this.addStatusBarItem();

		this.addCommand({
			id: 'insert-project-table-modal',
			name: 'Insert Project Table Modal',
			callback: () => {
				this.insertProjectTableModal();
			}
		});
	}

	onunload() {
		console.log("Obsidian Word Statistics.onunload()");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async loadSerialData(path: string) {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const loadPath = normalizePath(`${dir}/${path}`);
		if (await adapter.exists(path)) {
			return await adapter.read(loadPath);
		}
		return undefined;
	}

	async saveSerialData(path: string, data: string) {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const savePath = normalizePath(`${dir}/${path}`);
		try {
			await adapter.write(savePath, data);
		} catch (error) {
			new Notice(`Unable to write to ${path}.`);
			console.error(error);
		}
	}

	async logSpeed(wordsCounted: number, startTime: number, endTime: number) {
		let duration = endTime - startTime;
		// it must take at least 1 ms to be considered for the log
		if (duration > 0) {
			this.wordsPerMS.push(wordsCounted / duration);
		}

		if (this.wordsPerMS.length > 0) {
			console.log("Current average words/ms: ", this.wordsPerMS.reduce((a, v, i) => (a * i + v) / (i + 1)));
		}
	}

	async onInterval() {
		if (!this.initialScan) {
			// console.log("Initiating vault scan.");
			await this.collector.ScanVault();
			// console.log("Vault scan complete.");
			this.initialScan = true;
		}
		if (this.hudLastUpdate < this.collector.lastUpdate) {
			this.updateStatusBar();
		}
	}

	insertProjectTableModal() {
		if (this.collector.manager.projects.size > 0) {
			let projects = this.collector.manager;
			let modal = new ProjectTableModal(this.app, this, projects);
			modal.open();
			let project = modal.project;
			modal.clear();
			let tableText = BuildProjectTable(this.collector, this.settings.tableSettings, modal.project);

		} else {
			new Notice("There are no projects to display.");
		}
	}

	updateStatusBar() {
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (view != null && view.file != null) {
			let path = view.file.path;
			// let projects = this.collector.getProjectsFromPath(path);
			// console.log(projects);
			let words = this.collector.GetWords(path);
			let totalWords = this.collector.totalWords;

			// **Is this valid for mobile?**
			let wordStr = Intl.NumberFormat().format(words) + " / " + Intl.NumberFormat().format(totalWords);
			this.statusBar.setText(wordStr + " " + (totalWords == 1 ? "word" : "words"));
		} else {
			let totalWords = this.collector.totalWords;
			let wordStr = Intl.NumberFormat().format(totalWords);
			this.statusBar.setText(wordStr + " " + (totalWords == 1 ? "word" : "words") + " in vault.");
		}
		this.hudLastUpdate = Date.now();
	}

	onFileRename(file: TAbstractFile, data: string) {
		// console.log("'%s' renamed to '%s'", data, file.path);
		// if (file.path.search(/(.*)(\.md)/) >= 0) {
		if (file instanceof TFile && file.extension === "md") {
			this.collector.onRename(file, data);
			return;
		}
		// we may have renamed a folder
		// if (file.path.search(/^(.*)(?<!\.\w+)$/umig) >= 0) {
		if (file instanceof TFolder) {
			// we may be a folder
			// console.log(`Folder: '${file.path}'`);
			this.collector.manager.updateProjectsForFolder(file.path);
		}
	}

	onFileDelete(file: TAbstractFile, data: string) {
		// console.log("'%s' deleted.", file.path);
		//		if (file.path.search(/(.*)(\.md)/) >= 0) {
		if (file instanceof TFile && file.extension === "md") {
			this.collector.onDelete(file);
		}
	}

	onMDChanged(file: TFile, data: string, cache: CachedMetadata) {
		// console.log("onMDChanged(%s)", file.path, file);
		this.collector.UpdateFile(file);
	}

	onMDResolve(file: TFile) {
		// console.log("onMDResolve(%s)", file.path, file);
		this.collector.UpdateFile(file);
	}

	onLeafChange(leaf: WorkspaceLeaf) {
		// console.log("onLeafChange(%s)", leaf.view.getViewType());
		if (leaf.view.getViewType() === "markdown") {
			//console.log(leaf);
			/*
			let state = leaf.getViewState().state;
			if (state != undefined && state != null) {
				if (state.mode == 'preview') {
					//console.log(leaf.view.containerEl);
					let elements = leaf.view.containerEl.getElementsByClassName("markdown-preview-view");
					let text = FindRawText(elements[0]);
					let words = WordCountForText(text);
					// we now have the words for the rendered text
				}
			}
			*/
		}
	}

	async onFileOpen(file: TFile) {
		//console.log("onFileOpen()");
		//console.log(file);
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			this.debounceRunCount(file, await this.app.vault.cachedRead(file));
		}
	}

	onQuickPreview(file: TFile, data: string) {
		//console.log("onQuickPreview()");
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			this.debounceRunCount(file, data);
		}
	}

	onProjectUpdate(proj: WSProject) {
		// project has been updated, we now want to save all project data
		let data = this.collector.manager.serialize();
		this.saveSerialData(PROJECT_PATH, data);
	}

	onProjectFilesUpdate(proj: WSProject) {
		// update UI that project has been updated; anything watching for this project will need to obtain a new count
		// this.view.updateForProject(proj); // this needs to go through any project groups as well
	}

	RunCount(file: TFile, data: string) {
		// need to have some kind of logging system so people can report the words/ms rate average
		let startTime = Date.now();
		let words = WordCountForText(data);
		let endTime = Date.now();
		this.logSpeed(words, startTime, endTime);
		this.collector.LogWords(file.path, words);
		//console.log("RunCount() returned %d %s in %d ms", words, words == 1 ? "word" : "words", endTime - startTime);
		this.updateStatusBar();
	}
}
