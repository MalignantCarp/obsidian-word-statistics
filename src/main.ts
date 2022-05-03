import { App, debounce, Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, MetadataCache, Vault, MarkdownPreviewView, TAbstractFile, Notice, CachedMetadata, normalizePath, TFolder } from 'obsidian';
import { WSDataCollector } from './model/collector';
import WordStatsSettingTab, { DEFAULT_PLUGIN_SETTINGS, DEFAULT_TABLE_SETTINGS } from './settings';
import ProjectTableModal, { BuildProjectTable } from './tables';
import type { WSPluginSettings } from './settings';
import { WordCountForText } from './words';
import { ProjectGroupManagerModal, ProjectGroupViewerModal, ProjectManagerModal, ProjectViewerModal } from './ui/modals';
import type { WSProject } from './model/project';
import { WSFile } from './model/file';
import { Dispatcher, WSEvents, WSFocusEvent, WSProjectEvent, WSProjectGroupEvent } from './event';
import StatusBarWidget from './ui/svelte/StatusBar/StatusBarWidget.svelte';

const PROJECT_PATH = "projects.json";

export default class WordStatisticsPlugin extends Plugin {
	settings: WSPluginSettings;
	events: Dispatcher;
	debounceRunCount: Debouncer<[file: TFile, data: string]>;
	wordsPerMS: number[] = [];
	statusBar: HTMLElement;
	sbWidget: StatusBarWidget;
	collector: WSDataCollector;
	initialScan: boolean = false;
	projectLoad: boolean = false;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));
		this.collector = new WSDataCollector(this, this.app.vault, this.app.metadataCache);
		// console.log("Data collector and project manager instantiated:");
		// console.log(this.collector);
		// console.log(this.collector?.manager);

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

		// custom events
		this.events = new Dispatcher();

		this.events.on(WSEvents.Project.Updated, this.saveProjects.bind(this), {filter: null});
		this.events.on(WSEvents.Group.Updated, this.saveProjects.bind(this), {filter:null});
		this.statusBar = this.addStatusBarItem();
		this.sbWidget = new StatusBarWidget({ target: this.statusBar, props: { eventDispatcher: this.events, dataCollector: this.collector, projectManager: this.collector.manager } });

		// this.registerInterval(window.setInterval(this.onStartup.bind(this), 1000));
		this.app.workspace.onLayoutReady(this.onStartup.bind(this));


		this.addCommand({
			id: 'open-project-manager',
			name: 'Open Project Manager',
			callback: () => {
				this.openProjectManager();
			}
		});

		this.addCommand({
			id: 'open-project-viewer',
			name: 'Open Project Viewer',
			callback: () => {
				this.openProjectViewer();
			}
		});

		this.addCommand({
			id: 'open-project-group-manager',
			name: 'Open Project Group Manager',
			callback: () => {
				this.openProjectGroupManager();
			}
		});

		this.addCommand({
			id: 'open-project-group-viewer',
			name: 'Open Project Group Viewer',
			callback: () => {
				this.openProjectGroupViewer();
			}
		});

		// this.addCommand({
		// 	id: 'insert-project-table-modal',
		// 	name: 'Insert Project Table Modal',
		// 	editorCheckCallback: (checking: boolean) => {
		// 		if (checking) {
		// 			return this.collector.manager.isEmpty;
		// 		} else {
		// 			this.insertProjectTableModal();
		// 		}
		// 	}
		// });
		console.log("Obsidian Word Statistics loaded.");
	}

	onunload() {
		console.log("Obsidian Word Statistics unloaded.");
	}

	openProjectViewer() {
		let modal = new ProjectViewerModal(this.app, this, this.collector.manager);
		modal.open();
	}

	openProjectManager() {
		//let modal = this.collector.manager.modals.createProjectManagerModal();
		let modal = new ProjectManagerModal(this.app, this, this.collector.manager);
		modal.open();
	}

	openProjectGroupViewer() {
		let modal = new ProjectGroupViewerModal(this.app, this, this.collector.manager);
		modal.open();
	}

	openProjectGroupManager() {
		let modal = new ProjectGroupManagerModal(this.app, this, this.collector.manager);
		modal.open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
		console.log("Obsidian Word Statistics settings loaded.");
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Obsidian Word Statistics settings saved.");
	}

	async loadSerialData(path: string) {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const loadPath = normalizePath(`${dir}/${path}`);
		// console.log(adapter, dir, loadPath);
		if (await adapter.exists(loadPath)) {
			let data = await adapter.read(loadPath);
			// console.log(data);
			return data;
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

	async onStartup() {
		if (!this.initialScan) {
			// console.log("Initiating vault scan.");
			await this.collector.scanVault();
			// console.log("Vault scan complete.");
			this.initialScan = true;
		}
		if (!this.projectLoad && this.initialScan) {
			// console.log(`Loading data from ${PROJECT_PATH}`);
			let projects = await this.loadSerialData(PROJECT_PATH);
			if (projects) {
				// console.log(projects);
				this.collector.manager.populateFromSerialized(projects);
				this.collector.manager.updateAllProjects();
			}
			this.projectLoad = true;
			await this.collector.scanVault();
		}
		this.updateFocusedFile();
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

	updateFocusedFile() {
		let file: WSFile;
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (view != null && view.file != null) {
			file = this.collector.getFileSafer(view.file.path);
		}
		if (file instanceof WSFile) {
			this.events.trigger(new WSFocusEvent({ type: WSEvents.Focus.File, file: file }, {filter: file}));
		}
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
		this.collector.updateFile(file);
	}

	onMDResolve(file: TFile) {
		// console.log("onMDResolve(%s)", file.path, file);
		this.collector.updateFile(file);
	}

	onLeafChange(leaf: WorkspaceLeaf) {
		// console.log("onLeafChange(%s)", leaf.view.getViewType());
		if (leaf.view.getViewType() === "markdown") {
			this.updateFocusedFile();
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
		let wFile = this.collector.getFileSafer(file.path);
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

	saveProjects(evt: WSProjectEvent | WSProjectGroupEvent) {
		// project has been updated, we now want to save all project data
		let data = this.collector.manager.serialize();
		this.saveSerialData(PROJECT_PATH, data);
	}

	onProjectFilesUpdate(proj: WSProject) {
		// update UI that project has been updated; anything watching for this project will need to obtain a new count
		// this.view.updateForProject(proj); // this needs to go through any project groups as well
		// we may not even need this
	}

	onFileWordCount(file: WSFile) {
		// file word count has been updated, what to do?
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	RunCount(file: TFile, data: string) {
		// need to have some kind of logging system so people can report the words/ms rate average
		let startTime = Date.now();
		let words = WordCountForText(data);
		let endTime = Date.now();
		this.logSpeed(words, startTime, endTime);
		this.collector.logWords(file.path, words);
		//console.log("RunCount() returned %d %s in %d ms", words, words == 1 ? "word" : "words", endTime - startTime);
	}
}
