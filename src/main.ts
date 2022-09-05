import { debounce, type Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, TAbstractFile, Notice, type CachedMetadata, normalizePath, TFolder, View, FileExplorer, ItemView } from 'obsidian';
import { WSDataCollector } from './model/collector';
import WordStatsSettingTab, { Settings } from './settings';
import ProjectTableModal, { BuildProjectTable } from './tables';
import { WordCountForText } from './words';
import { WSFile } from './model/file';
import { Dispatcher, WSDataEvent, WSEvents, WSFileEvent, WSFocusEvent } from './model/event';
import StatusBarWidget from './ui/svelte/StatusBar/StatusBarWidget.svelte';
import { PROJECT_MANAGEMENT_VIEW, ProjectManagementView } from './ui/ProjectManagementView';
import { WSFormat } from './model/formats';
import type { WSProject } from './model/project';
import { FormatWords } from './util';
import { StatisticsView, STATISTICS_VIEW } from './ui/StatisticsView';

const PROJECT_PATH = "projects.json";
const FILE_PATH = "files.json";
const PATH_PATH = "paths.json";
const STATS_PATH = "stats.json";

const FILE_EXP_CLASS = "mc-ws-file-explorer-counts";
const FILE_EXP_DATA_ATTRIBUTE = "data-mc-word-stats";

declare module "obsidian" {
	export class FileExplorer extends View {
		fileItems: { [key: string]: FileItem; };
		getDisplayText(): string;
		getViewType(): string;
	}

	export interface FileItem {
		titleEl: HTMLDivElement;
	}
}

export default class WordStatisticsPlugin extends Plugin {
	settings: Settings.Plugin.Structure;
	events: Dispatcher;
	debounceRunCount: Debouncer<[file: TFile, data: string], any>;
	wordsPerMS: number[] = [];
	statusBar: HTMLElement;
	sbWidget: StatusBarWidget;
	collector: WSDataCollector;
	initialScan: boolean = false;
	projectLoad: boolean = false;
	focusFile: WSFile = null;
	noFileData: boolean = true;
	fileExplorer: FileExplorer;

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

		this.registerView(STATISTICS_VIEW.type, (leaf) => {
			return new StatisticsView(leaf, this);
		});

		this.addCommand({
			id: 'statistics-csv',
			name: 'Backup statistics to CSV',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.collector.stats.periods.length > 0;
				} else {
					this.saveStatsCSV();
				}
			}
		})

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
			id: 'attach-statistics-view',
			name: 'Attach Statistics View',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.app.workspace.getLeavesOfType(STATISTICS_VIEW.type).length === 0;
				} else {
					this.initializeStatisticsLeaf();
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
			this.app.workspace.onLayoutReady(this.initializeStatisticsLeaf.bind(this));
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

	initializeStatisticsLeaf() {
		if (this.app.workspace.getLeavesOfType(STATISTICS_VIEW.type).length > 0) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: STATISTICS_VIEW.type
		});
	}

	async loadSettings() {
		// console.log("Loading user settings. Default settings:");
		// console.log(Settings.Plugin.DEFAULT);

		let userSettings: any;
		try {
			userSettings = await this.loadData();
		} catch (error) {
			userSettings = {};
		}
		// console.log("Currently saved user settings:");
		// console.log(userSettings);
		this.settings = Object.assign({}, Settings.Plugin.DEFAULT, userSettings);
		// console.log("Finalized user settings loaded:");
		// console.log(this.settings);
		console.log("Obsidian Word Statistics settings loaded.");
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log("Obsidian Word Statistics settings saved.");
		this.updateFileExplorer();
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
			// console.log(`Counted ${FormatWords(wordsCounted)} in ${duration} ms`)
			this.wordsPerMS.push(wordsCounted / duration); // words per millisecond
		}

		if (this.wordsPerMS.length > 0 && this.settings.showWordCountSpeedDebug) {
			let sum = this.wordsPerMS.reduce((accumulator, a) => accumulator + a, 0);
			let avg = sum / this.wordsPerMS.length;
			console.log(`Running average words counted per millisecond: ${avg}`);
			// console.log(this.wordsPerMS);
		}
	}

	async onStartup() {
		if (!this.initialScan) {
			// console.log("Loading existing file content...");
			let fileData = await this.loadSerialData(FILE_PATH);
			let files: WSFile[] = [];
			if (fileData) {
				this.noFileData = false;
				files = WSFormat.LoadFileData(fileData);
			}

			await this.collector.scanVault(files);
			// console.log("Vault scan complete.");
			this.initialScan = true;
		}
		if (!this.projectLoad && this.initialScan) {
			let statsData = await this.loadSerialData(STATS_PATH);
			// console.log("Read stats.json: ", statsData? statsData.length : undefined)
			if (statsData) {
				let stats = WSFormat.LoadStatisticalData(this.collector, this.collector.stats, statsData);
				// console.log(stats);
				if (stats.length > 0) {
					this.collector.stats.loadStats(stats);
				}
			}
			this.collector.stats.unlock();
			// console.log(`Loading data from ${PROJECT_PATH}`);\
			// Load paths first as projects will fill up paths and set children
			let pathData = await this.loadSerialData(PATH_PATH);
			if (pathData) {
				let paths = WSFormat.LoadPathData(pathData);
				if (paths.length > 0) {
					// console.log(paths);
					this.collector.manager.loadPaths(paths);
				}
			}
			let projData = await this.loadSerialData(PROJECT_PATH);
			if (projData) {
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
			this.events.on(WSEvents.Data.Stats, this.saveStatistics.bind(this), { filter: null });

			this.events.on(WSEvents.File.WordsChanged, this.onFileWordCount.bind(this), { filter: null });

			// this.registerEvent(this.app.metadataCache.on("changed", this.onMDChanged.bind(this)));
			this.registerEvent(this.app.metadataCache.on("resolve", this.onMDResolve.bind(this)));
			this.registerEvent(this.app.vault.on("create", this.onFileCreate.bind(this)));

		}
		if (this.collector.fileList && this.noFileData) {
			this.events.trigger(new WSDataEvent({ type: WSEvents.Data.File }, { filter: null }));
		}

		this.updateFocusedFile();
		let fe = this.app.workspace.getLeavesOfType("file-explorer");
		if (fe.length != 1) {
			console.log(`Found ${fe.length} file-explorer ${fe.length === 1 ? "leaf" : "leaves"}`);
		}
		this.fileExplorer = fe[0].view as FileExplorer;
		this.registerEvent(this.app.workspace.on("layout-change", this.onLayoutChange.bind(this)));
		this.updateFileExplorer();
	}

	onLayoutChange() {
		let fe = this.app.workspace.getLeavesOfType("file-explorer");
		if (fe.length != 1) {
			console.log(`Found ${fe.length} file-explorer ${fe.length === 1 ? "leaf" : "leaves"}`);
		}
		this.fileExplorer = fe[0].view as FileExplorer;
		this.updateFileExplorer();
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
			new Notice("Unable to insert table. Not editing a Markdown file.");
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
		this.updateFileExplorer();
	}

	onFileDelete(file: TAbstractFile) {
		// console.log("'%s' deleted.", file.path);
		//		if (file.path.search(/(.*)(\.md)/) >= 0) {
		if (file instanceof TFile && file.extension === "md") {
			this.collector.onDelete(file);
		}
		this.updateFileExplorer();
	}

	onFileCreate(file: TAbstractFile) {
		if (file instanceof TFile && file.extension === "md") {
			this.collector.onCreate(file);
		}
		this.updateFileExplorer();
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

	saveStatistics(event: WSDataEvent) {
		let data = WSFormat.SaveStatisticalData(this, this.collector.stats.periods);
		// console.log(data);
		this.saveSerialData(STATS_PATH, data);
	}

	saveStatsCSV() {
		let csv = WSFormat.StatisticDataToCSV(this, this.collector.stats.periods);
		let path = new Date().toISOString() + ".csv";
		// console.log("Saving to ", path);
		// console.log(csv);
		this.saveSerialData(path, csv);
	}

	onFileWordCount(evt: WSFileEvent) {
		// file word count has been updated, what to do?
		// console.log("onFileWordCount()");
		this.updateFileExplorer(evt.info.file);
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

	updateFileExplorer(file: WSFile = null) {
		if (this.fileExplorer instanceof View) {
			if (this.settings.showWordCountsInFileExplorer) {
				let container = this.fileExplorer.containerEl;
				container.toggleClass(FILE_EXP_CLASS, true);
				let fileList = this.fileExplorer.fileItems;
				for (let path in fileList) {
					// console.log(path, file?.path, file instanceof WSFile && file.path.contains(path));
					if (file === null || (file instanceof WSFile && file.path.includes(path))) {
						// console.log("Updating ", path);
						let wFile = this.collector.getFile(path);
						let item = fileList[path];
						if (wFile instanceof WSFile) {
							item.titleEl.setAttribute(FILE_EXP_DATA_ATTRIBUTE, FormatWords(wFile.words));
						} else {
							let words = this.collector.getWordCountForFolder(path);
							item.titleEl.setAttribute(FILE_EXP_DATA_ATTRIBUTE, FormatWords(words));
						}
					}
				}
			} else {
				let container = this.fileExplorer.containerEl;
				container.toggleClass(FILE_EXP_CLASS, false);
				let fileList = this.fileExplorer.fileItems;
				for (let path in fileList) {
					let item = fileList[path];
					item.titleEl.removeAttribute(FILE_EXP_DATA_ATTRIBUTE);
				}
			}
		} else {
			console.log("Tried to update file explorer, but it was invalid.");
		}
	}
}
