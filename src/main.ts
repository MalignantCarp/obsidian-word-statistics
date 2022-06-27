import { debounce, type Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, TAbstractFile, Notice, type CachedMetadata, normalizePath, TFolder } from 'obsidian';
import { WSDataCollector } from './model/collector';
import WordStatsSettingTab, { DEFAULT_PLUGIN_SETTINGS } from './settings';
import ProjectTableModal, { BuildProjectTable } from './tables';
import type { WSPluginSettings } from './settings';
import { WordCountForText } from './words';
import type { WSFile } from './model/file';
import { Dispatcher, WSDataEvent, WSEvents, WSFocusEvent } from './model/event';
import StatusBarWidget from './ui/svelte/StatusBar/StatusBarWidget.svelte';
import { PROJECT_MANAGEMENT_VIEW, ProjectManagementView } from './ui/ProjectManagementView';
import { WSFormat } from './model/formats';
import type { WSProject } from './model/project';

const PROJECT_PATH = "projects.json";
const FILE_PATH = "files.json";
const PATH_PATH = "paths.json";

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
	focusFile: WSFile = null;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));
		this.collector = new WSDataCollector(this, this.app.vault, this.app.metadataCache);

		this.debounceRunCount = debounce(
			(file: TFile, data: string) => this.RunCount(file, data),
			250,
			false
		);
		// there has to be a better event to hook onto here, this seems silly
		this.registerEvent(this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this)));
		this.registerEvent(this.app.workspace.on("active-leaf-change", this.onLeafChange.bind(this)));
		this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen.bind(this)));

		this.registerEvent(this.app.workspace.on("editor-paste", this.onPasteEvent.bind(this)));

		this.registerEvent(this.app.vault.on("delete", this.onFileDelete.bind(this)));
		this.registerEvent(this.app.vault.on("rename", this.onFileRename.bind(this)));

		// custom events
		this.events = new Dispatcher();

		this.statusBar = this.addStatusBarItem();
		this.sbWidget = new StatusBarWidget({ target: this.statusBar, props: { eventDispatcher: this.events, dataCollector: this.collector, projectManager: this.collector.manager } });

		this.registerView(PROJECT_MANAGEMENT_VIEW.type, (leaf) => {
			return new ProjectManagementView(leaf, this);
		});

		this.addCommand({
			id: 'attach-project-manager',
			name: 'Attach Project Management View',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.app.workspace.getLeavesOfType(PROJECT_MANAGEMENT_VIEW.type).length === 0;
				} else {
					this.initializeProjectManagementLeaf();
				}
			}
		});

		this.addCommand({
			id: 'insert-project-table-modal',
			name: 'Insert Project Table Modal',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return !this.collector.manager.isEmpty;
				} else {
					this.insertProjectTableModal();
				}
			}
		});

		if (this.app.workspace.layoutReady) {
			this.onStartup();
			this.initializeProjectManagementLeaf();
		} else {
			this.app.workspace.onLayoutReady(this.onStartup.bind(this));
			this.app.workspace.onLayoutReady(this.initializeProjectManagementLeaf.bind(this));
		}

		console.log("Obsidian Word Statistics loaded.");
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(PROJECT_MANAGEMENT_VIEW.type);
		this.collector.manager.cleanup();
		this.collector.cleanup();
		console.log("Obsidian Word Statistics unloaded.");
	}

	onPasteEvent(evt: ClipboardEvent) {
		// we can capture clipboard data like so:
		// console.log(evt.clipboardData.getData("text"))
		// but there is no Obsidian event that can fire when something is copied or cut
	}

	initializeProjectManagementLeaf() {
		if (this.app.workspace.getLeavesOfType(PROJECT_MANAGEMENT_VIEW.type).length > 0) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: PROJECT_MANAGEMENT_VIEW.type,
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
		console.log("Obsidian Word Statistics settings loaded.");
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Obsidian Word Statistics settings saved.");
	}

	async loadSerialData(path: string): Promise<string> {
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
			// console.log("Loading existing file content...");
			let fileData = await this.loadSerialData(FILE_PATH);
			let files: WSFile[] = [];
			if (fileData != undefined) {
				files = WSFormat.LoadFileData(fileData);
			}

			await this.collector.scanVault(files);
			// console.log("Vault scan complete.");
			this.initialScan = true;
		}
		if (!this.projectLoad && this.initialScan) {
			// console.log(`Loading data from ${PROJECT_PATH}`);\
			// Load paths first as projects will fill up paths and set children
			let pathData = await this.loadSerialData(PATH_PATH);
			if (pathData != undefined) {
				let paths = WSFormat.LoadPathData(pathData);
				if (paths.length > 0) {
					// console.log(paths);
					this.collector.manager.loadPaths(paths);
				}
			}
			let projData = await this.loadSerialData(PROJECT_PATH);
			if (projData != undefined) {
				let projects = WSFormat.LoadProjectData(this.collector, projData);
				if (projects.length > 0) {
					// console.log(projects);
					this.collector.manager.loadProjects(projects);
				}
			}
			this.projectLoad = true;

			// console.log("Initiating post-project vault re-scan...");
			// await this.collector.scanVault();
			// console.log("Complete.")
			// We don't want to queue saving of data until it's all loaded.
			this.events.on(WSEvents.Data.Project, this.saveProjects.bind(this), { filter: null });
			this.events.on(WSEvents.Data.Path, this.savePaths.bind(this), { filter: null });
			this.events.on(WSEvents.Data.File, this.saveFiles.bind(this), { filter: null });

			// this.registerEvent(this.app.metadataCache.on("changed", this.onMDChanged.bind(this)));
			this.registerEvent(this.app.metadataCache.on("resolve", this.onMDResolve.bind(this)));
			this.registerEvent(this.app.vault.on("create", this.onFileCreate.bind(this)));

		}
		this.updateFocusedFile();
	}

	insertProjectTableModal() {
		if (this.collector.manager.projects.size > 0) {

			let projects = this.collector.manager;
			let modal = new ProjectTableModal(this.app, this, projects, this.runBuildTable.bind(this));
			modal.open();
		} else {
			new Notice("There are no projects to display.");
		}
	}

	runBuildTable(project: WSProject) {
		let tableText = BuildProjectTable(this.collector, this.settings.tableSettings, project);
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			let cursor = view.editor.replaceRange(tableText, view.editor.getCursor());

		} else {
			new Notice("Unable to insert table. Not editing a Markdown file.")
		}

	}

	updateFocusedFile() {
		let file: WSFile = null;
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (view != null && view.file != null) {
			file = this.collector.getFile(view.file.path);
		}
		// console.log("[!] Updating focused file:", file instanceof WSFile ? file.serialize() : null);
		this.events.trigger(new WSFocusEvent({ type: WSEvents.Focus.File, file: file }, { filter: file }));
		this.focusFile = file;
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

	onFileDelete(file: TAbstractFile) {
		// console.log("'%s' deleted.", file.path);
		//		if (file.path.search(/(.*)(\.md)/) >= 0) {
		if (file instanceof TFile && file.extension === "md") {
			this.collector.onDelete(file);
		}
	}

	onFileCreate(file: TAbstractFile) {
		if (file instanceof TFile && file.extension === "md") {
			this.collector.onCreate(file);
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
		// console.log("onFileOpen()");
		//console.log(file);
		if (file instanceof TFile) {
			let wFile = this.collector.getFile(file.path);
			if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
				this.debounceRunCount(file, await this.app.vault.cachedRead(file));
			}
		} else {
			this.updateFocusedFile();
		}
	}

	onQuickPreview(file: TFile, data: string) {
		//console.log("onQuickPreview()");
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			this.debounceRunCount(file, data);
		}
	}

	saveProjects(evt: WSDataEvent) {
		let data = WSFormat.SaveProjectData(this, this.collector.manager.projectList);
		// console.log(data);
		this.saveSerialData(PROJECT_PATH, data);
	}

	saveFiles(event: WSDataEvent) {
		let data = WSFormat.SaveFileData(this, this.collector.fileList);
		// console.log(data);
		this.saveSerialData(FILE_PATH, data);
	}

	savePaths(event: WSDataEvent) {
		let data = WSFormat.SavePathData(this, this.collector.manager.getSetPaths());
		// console.log(data);
		this.saveSerialData(PATH_PATH, data);
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
