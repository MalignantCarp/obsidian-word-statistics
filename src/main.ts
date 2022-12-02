import { debounce, type Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, TAbstractFile, Notice, type CachedMetadata, normalizePath, TFolder, View, FileExplorer, ItemView, Menu, type Stat } from 'obsidian';
import WordStatsSettingTab, { Settings } from './settings';
import { WSFile, WSFileStat } from './model/file';
import { Dispatcher, WSDataEvent, WSEvents, WSFileEvent, WSFocusEvent, WSFolderEvent } from './model/events';
import { FormatWords } from './util';
import { WSFileManager } from './model/manager';
import { ImportTree } from './model/import';
import { RECORDING, WSFolder } from './model/folder';
import { BuildRootJSON, StatisticDataToCSV, StatisticsDataToCSVFolder } from './model/export';
import { DateTime } from 'luxon';
import StatusBar from './ui/svelte/StatusBar.svelte';
import { ProgressView, PROGRESS_VIEW } from './ui/obsidian/ProgressView';
import { TextInputBox } from './ui/obsidian/TextInputBox';
import { GoalModal } from './ui/obsidian/GoalModal';
import { StatisticsView, STATISTICS_VIEW } from './ui/obsidian/StatisticsView';

const DB_PATH = "database.json";

const FILE_EXP_CLASS = "ws-file-explorer-counts";
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
	debounceSave: Debouncer<any, any>;
	wordsPerMS: number[] = [];
	statusBar: HTMLElement;
	sbWidget: StatusBar;
	initialScan: boolean = false;
	projectLoad: boolean = false;
	focusFile: WSFile = null;
	noFileData: boolean = true;
	fileExplorer: FileExplorer;
	paranoiaTest: number = 0;
	lastFile: WSFile = null;
	updateTime: number = 0;
	manager: WSFileManager;
	databaseCheck: Stat = null;

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));
		//this.collector = new WSDataCollector(this, this.app.vault, this.app.metadataCache);
		this.manager = new WSFileManager(this, this.app.vault, this.app.metadataCache, null);

		this.debounceRunCount = debounce(
			(file: TFile, data: string) => {
				this.RunCount(file, data);
			},
			250,
			false
		);

		this.debounceSave = debounce(
			() => {
				this.statsChangedSave();
			},
			2000,
			true
		);
		// there has to be a better event to hook onto here, this seems silly
		this.registerEvent(this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this)));
		this.registerEvent(this.app.workspace.on("active-leaf-change", this.onLeafChange.bind(this)));
		this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen.bind(this)));

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, source) => {
				this.onFileMenu(menu, file, source);
			}));


		//this.registerEvent(this.app.workspace.on("editor-paste", this.onPasteEvent.bind(this)));

		this.registerEvent(this.app.vault.on("delete", this.onFileDelete.bind(this)));
		this.registerEvent(this.app.vault.on("rename", this.onFileRename.bind(this)));

		// custom events
		this.events = new Dispatcher();

		this.statusBar = this.addStatusBarItem();
		this.sbWidget = new StatusBar({ target: this.statusBar, props: { plugin: this } });

		// this.registerView(PROJECT_MANAGEMENT_VIEW.type, (leaf) => {
		// 	return new ProjectManagementView(leaf, this);
		// });

		this.registerView(STATISTICS_VIEW.type, (leaf) => {
			return new StatisticsView(leaf, this);
		});

		this.registerView(PROGRESS_VIEW.type, (leaf) => {
			return new ProgressView(leaf, this);
		});

		this.addCommand({
			id: 'statistics-csv',
			name: 'Backup statistics to CSV',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.manager.stats.stats.length > 0;
				} else {
					if (this.manager.stats.last instanceof WSFileStat) {
						this.saveStatsCSV(true);
					} else {
						new Notice("No statistics to back up. Backup aborted.");
					}
				}
			}
		});

		this.addCommand({
			id: 'recording-on',
			name: 'Set Statistics Recording State for Parent Folder to ON',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.focusFile instanceof WSFile && this.focusFile.parent.recording !== RECORDING.ON;
				} else {
					this.cmdSetMonitorOn();
				}
			}
		});

		this.addCommand({
			id: 'recording-off',
			name: 'Set Statistics Recording State for Parent Folder to OFF',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.focusFile instanceof WSFile && this.focusFile.parent.recording !== RECORDING.OFF;
				} else {
					this.cmdSetMonitorOff();
				}
			}
		});

		this.addCommand({
			id: 'recording-inherit',
			name: 'Set Statistics Recording State for Parent Folder to INHERIT',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.focusFile instanceof WSFile && this.focusFile.parent.recording !== RECORDING.INHERIT;
				} else {
					this.cmdSetMonitorInherit();
				}
			}
		});

		// this.addCommand({
		// 	id: 'attach-project-manager',
		// 	name: 'Attach Project Management View',
		// 	editorCheckCallback: (checking: boolean) => {
		// 		if (checking) {
		// 			return this.app.workspace.getLeavesOfType(PROJECT_MANAGEMENT_VIEW.type).length === 0;
		// 		} else {
		// 			this.initializeProjectManagementLeaf();
		// 		}
		// 	}
		// });

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
			id: 'attach-progress-view',
			name: 'Attach Progress View',
			editorCheckCallback: (checking: boolean) => {
				if (checking) {
					return this.app.workspace.getLeavesOfType(PROGRESS_VIEW.type).length === 0;
				} else {
					this.initializeProgressLeaf();
				}
			}
		});

		// this.addCommand({
		// 	id: 'insert-project-table-modal',
		// 	name: 'Insert Project Table Modal',
		// 	editorCheckCallback: (checking: boolean) => {
		// 		if (checking) {
		// 			return !this.collector.manager.isEmpty;
		// 		} else {
		// 			this.insertProjectTableModal();
		// 		}
		// 	}
		// });

		if (this.app.workspace.layoutReady) {
			this.onStartup();
			// this.initializeProjectManagementLeaf();
			this.initializeStatisticsLeaf();
			this.initializeProgressLeaf();
		} else {
			this.app.workspace.onLayoutReady(this.onStartup.bind(this));
		}

		console.log("Obsidian Word Statistics loaded.");
	}

	saveStatsCSV(command: boolean = false) {
		let now = DateTime.utc();
		let path = now.toFormat('yyyy-LL-dd') + "T" + now.toFormat('HH_mm_ss_SSS') + "Z";
		if (command || this.settings.statistics.paranoiaMode !== Settings.Statistics.PARANOIA.FOLDERS) {
			let csvFiles = StatisticDataToCSV(this);
			this.saveSerialData(path + " files.csv", csvFiles);
		}
		if (command || this.settings.statistics.paranoiaMode !== Settings.Statistics.PARANOIA.FILES) {
			let csvFolders = StatisticsDataToCSVFolder(this);
			this.saveSerialData(path + " folders.csv", csvFolders);
		}
	}

	paranoiaHandler() {
		// console.log("Checking for paranoia...");
		// console.log(this.settings.statisticSettings.paranoiaMode, this.manager.stats.last instanceof WSFileStat, Date.now(), this.paranoiaTest, this.settings.statisticSettings.paranoiaInterval*60000);
		// First check if paranoia mode is on, then if we have any stats, then if we've exceeded our interval, then if the most recent stat was updated after
		// the last interval (i.e., we haven't already saved it).
		if (this.settings.statistics.paranoiaMode !== Settings.Statistics.PARANOIA.OFF &&
			this.manager.stats.last instanceof WSFileStat &&
			Date.now() > this.paranoiaTest + this.settings.statistics.paranoiaInterval * 60000 &&
			this.manager.stats.last.endTime > this.paranoiaTest) {
			// console.log("Paranoia interval exceeded. Saving stats.")
			this.saveStatsCSV();
			// console.log("Done. resetting interval");
			this.paranoiaTest = Date.now();
		}
	}

	setMonitorOn(folder: WSFolder) {
		this.manager.setMonitoringForFolder(folder, RECORDING.ON);
		new Notice(`Statistics recording set ON for folder: ${folder.path}`);
	}

	cmdSetMonitorOn() {
		if (this.focusFile instanceof WSFile) {
			this.setMonitorOn(this.focusFile.parent);
		} else {
			new Notice("No file has focus. Statistics recording not set.");
		}
	}

	setMonitorOff(folder: WSFolder) {
		this.manager.setMonitoringForFolder(folder, RECORDING.OFF);
		new Notice(`Statistics recording set OFF for folder: ${folder.path}`);
	}

	cmdSetMonitorOff() {
		if (this.focusFile instanceof WSFile) {
			this.setMonitorOff(this.focusFile.parent);
		} else {
			new Notice("No file has focus. Statistics recording not set.");
		}
	}

	setMonitorInherit(folder: WSFolder) {
		this.manager.setMonitoringForFolder(folder, RECORDING.INHERIT);
		new Notice(`Statistics recording set INHERIT for folder: ${folder.path}`);
	}

	cmdSetMonitorInherit() {
		if (this.focusFile instanceof WSFile) {
			this.setMonitorInherit(this.focusFile.parent);
		} else {
			new Notice("No file has focus. Statistics recording not set.");
		}
	}

	setFolderTitle(folder: WSFolder) {
		let modal = new TextInputBox(
			this,
			"Set Folder Title",
			"Please provide a title for this folder to be displayed in all Word Statistics views.",
			folder.getTitle.bind(folder),
			(text: string) => {
				console.log(text, folder);
				if (text != folder.title) {
					folder.title = text || "";
					folder.triggerTitleSet(text || "");
					this.manager.triggerFolderUpdate(folder);
				}
			},
			"Save");
		modal.open();
	}

	clearFolderTitle(folder: WSFolder) {
		if (folder.title === "") return;
		folder.title = "";
		folder.triggerTitleSet("");
	}

	setFolderGoals(folder: WSFolder) {
		let modal = new GoalModal(this, folder);
		modal.open();
	}

	onFileMenu(menu: Menu, file: TAbstractFile, source: string): void {
		if (source !== "file-explorer-context-menu") return;
		if (!file) return;
		if (file instanceof TFolder) {
			let ref = this.manager.folderMap.get(file.path);
			if (!(ref instanceof WSFolder)) return;
			menu.addItem((item) => {
				item
					.setTitle(`Word Statistics Monitoring: On`)
					.setIcon('monitor')
					.setSection("word-stats")
					.onClick(() => {
						this.setMonitorOn(ref);
					});
			});
			menu.addItem((item) => {
				item
					.setTitle(`Word Statistics Monitoring: Off`)
					.setIcon('monitor-off')
					.setSection("word-stats")
					.onClick(() => {
						this.setMonitorOff(ref);
					});
			});
			menu.addItem((item) => {
				item
					.setTitle(`Word Statistics Monitoring: Inherit`)
					.setIcon('network')
					.setSection("word-stats")
					.onClick(() => {
						this.setMonitorInherit(ref);
					});
			});
			menu.addItem((item) => {
				item
					.setTitle(`Word Statistics: Set Folder Title`)
					.setIcon(`text-cursor-input`)
					.setSection(`word-stats`)
					.onClick(() => {
						this.setFolderTitle(ref);
					});
			});
			menu.addItem((item) => {
				item
					.setTitle(`Word Statistics: Clear Folder Title`)
					.setIcon(`form-input`)
					.setSection(`word-stats`)
					.onClick(() => {
						this.clearFolderTitle(ref);
					});
			});
			menu.addItem((item) => {
				item
					.setTitle(`Word Statistics: Manage Word Goals for Folder`)
					.setIcon(`target`)
					.setSection(`word-stats`)
					.onClick(() => {
						this.setFolderGoals(ref);
					});
			});
		}
	}

	onunload() {
		// this.app.workspace.detachLeavesOfType(PROJECT_MANAGEMENT_VIEW.type);
		this.app.workspace.detachLeavesOfType(STATISTICS_VIEW.type);
		this.app.workspace.detachLeavesOfType(PROGRESS_VIEW.type);
		// this.collector.manager.cleanup();
		this.manager.cleanup();
		console.log("Obsidian Word Statistics unloaded.");
	}

	onPasteEvent(evt: ClipboardEvent) {
		// we can capture clipboard data like so:
		// console.log(evt.clipboardData.getData("text"))
		// but there is no Obsidian event that can fire when something is copied or cut
	}

	// initializeProjectManagementLeaf() {
	// 	if (this.app.workspace.getLeavesOfType(PROJECT_MANAGEMENT_VIEW.type).length > 0) {
	// 		return;
	// 	}
	// 	this.app.workspace.getRightLeaf(false).setViewState({
	// 		type: PROJECT_MANAGEMENT_VIEW.type,
	// 	});
	// }

	initializeStatisticsLeaf() {
		if (this.app.workspace.getLeavesOfType(STATISTICS_VIEW.type).length > 0) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: STATISTICS_VIEW.type
		});
	}

	initializeProgressLeaf() {
		if (this.app.workspace.getLeavesOfType(PROGRESS_VIEW.type).length > 0) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: PROGRESS_VIEW.type
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
		};
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

	async getStat(path: string) {
		const adapter = this.app.vault.adapter;
		const dir = this.manifest.dir;
		const statPath = normalizePath(`${dir}/${path}`);
		try {
			let stat = await adapter.stat(statPath);
			return stat;
		} catch (error) {
			new Notice(`Unable to access ${path}.`);
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

		if (this.wordsPerMS.length > 0 && this.settings.debug.showWordCountSpeed) {
			let sum = this.wordsPerMS.reduce((total, val) => total + val, 0);
			let avg = sum / this.wordsPerMS.length;
			console.log(`Running average words counted per millisecond: ${avg}`);
			// console.log(this.wordsPerMS);
		}
	}

	async onStartup() {
		if (!this.initialScan) {
			// console.log("Loading existing file content...");
			let statsData = await this.loadSerialData(DB_PATH);

			if (statsData && statsData.length > 0) {
				let [root, folderMap, fileMap, message] = ImportTree(this, statsData);
				if (message) {
					console.log("Could not complete initialization of saved data: ", message);
					return;
				}
				this.noFileData = false;
				await this.manager.loadTree(root, folderMap, fileMap);
			} else {
				// file is empty
				// so we will need to rebuild the entire tree
				// console.log("Building file tree...");
				await this.manager.buildTree();
				// console.log("Done.");
				// console.log(this.manager.root);
			}
			// console.log("Vault scan complete.");
			this.initialScan = true;
			this.sbWidget.updateVault();
			// console.log("Initiating post-project vault re-scan...");
			// await this.collector.scanVault();
			// console.log("Complete.")
			// We don't want to queue saving of data until it's all loaded.
			this.events.on(WSEvents.Data.Folder, this.databaseChangedSave.bind(this), { filter: null });
			this.events.on(WSEvents.Data.File, this.databaseChangedSave.bind(this), { filter: null });
			this.events.on(WSEvents.File.WordsChanged, this.onFileWordCount.bind(this), { filter: null });
			this.events.on(WSEvents.Folder.WordsChanged, this.onFolderWordCount.bind(this), { filter: null });

			// this.registerEvent(this.app.metadataCache.on("changed", this.onMDChanged.bind(this)));
			this.registerEvent(this.app.metadataCache.on("resolve", this.onMDResolve.bind(this)));
			this.registerEvent(this.app.vault.on("create", this.onFileCreate.bind(this)));
			this.registerInterval(window.setInterval(this.paranoiaHandler.bind(this), 1000)); // run every 1 second
			// this.initializeProjectManagementLeaf();
			this.initializeStatisticsLeaf();
		}
		if (this.noFileData) {
			this.databaseChangedSave();
		}
		this.updateFocusedFile();
		let fe = this.app.workspace.getLeavesOfType("file-explorer");
		if (fe.length != 1) {
			console.log(`Found ${fe.length} file-explorer ${fe.length === 1 ? "leaf" : "leaves"}`);
		}
		this.fileExplorer = fe[0].view as FileExplorer;
		this.registerEvent(this.app.workspace.on("layout-change", this.onLayoutChange.bind(this)));
		if (this.lastFile instanceof WSFile) this.databaseCheck = await this.getStat(DB_PATH);
		this.updateFileExplorer();
	}

	databaseChangedSave(event?: WSDataEvent) {
		// console.log("Received WSDataEvent");
		// console.log(this.lastFile);
		if (!(this.lastFile instanceof WSFile)) return; // if we don't have a last file, no stats have been saved at this point
		// console.log("Saving stats");
		this.saveFiles();
	}

	async statsChangedSave() {
		// console.log("<WS>", Date.now());
		if (!(this.lastFile instanceof WSFile)) return; // if we don't have a last file, no stats have been saved at this point
		let update = Date.now();
		// console.log(update, this.lastFile instanceof WSFile);
		if (this.lastFile.last?.endTime < this.updateTime) return; // if there have been no updates since last update, return
		// console.log("Saving data.")
		this.updateTime = update;
		this.saveFiles();
	}

	saveFiles() {
		if (this.manager.fileMap.size === 0 && this.manager.folderMap.size === 0) return;
		let statsData = BuildRootJSON(this, this.manager.root);
		// console.log(statsData);
		this.saveSerialData(DB_PATH, statsData);
	}

	onLayoutChange() {
		let fe = this.app.workspace.getLeavesOfType("file-explorer");
		if (fe.length != 1) {
			console.log(`Found ${fe.length} file-explorer ${fe.length === 1 ? "leaf" : "leaves"}`);
		}
		this.fileExplorer = fe[0].view as FileExplorer;
		this.updateFileExplorer();
	}

	// insertProjectTableModal() {
	// 	if (this.collector.manager.projects.size > 0) {

	// 		let projects = this.collector.manager;
	// 		let modal = new ProjectTableModal(this.app, this, projects, this.runBuildTable.bind(this));
	// 		modal.open();
	// 	} else {
	// 		new Notice("There are no projects to display.");
	// 	}
	// }

	// runBuildTable(project: WSProject) {
	// 	let tableText = BuildProjectTable(this.collector, this.settings.tableSettings, project);
	// 	let view = this.app.workspace.getActiveViewOfType(MarkdownView);
	// 	if (view) {
	// 		let cursor = view.editor.replaceRange(tableText, view.editor.getCursor());

	// 	} else {
	// 		new Notice("Unable to insert table. Not editing a Markdown file.");
	// 	}

	// }

	updateFocusedFile() {
		let file: WSFile = null;
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (view != null && view.file instanceof TFile) {
			file = this.manager.getFile(view.file);
		}
		// console.log("[!] Updating focused file:", file instanceof WSFile ? file.serialize() : null);
		this.focusFile = file;
		this.events.trigger(new WSFocusEvent({ type: WSEvents.Focus.File, file }, { filter: file }));
	}

	onFileRename(file: TAbstractFile, data: string) {
		// console.log("'%s' renamed to '%s'", data, file.path);
		if (file instanceof TFolder || (file instanceof TFile && file.extension === "md")) {
			this.manager.onRename(file, data);
			return;
		}
		this.updateFileExplorer();
	}

	onFileDelete(file: TAbstractFile) {
		// console.log("'%s' deleted.", file.path);
		if (file instanceof TFolder || (file instanceof TFile && file.extension === "md")) {
			this.manager.onDelete(file);
		}
		this.updateFileExplorer();
	}

	onFileCreate(file: TAbstractFile) {
		if (file instanceof TFolder || (file instanceof TFile && file.extension === "md")) {
			this.manager.onCreate(file);
		}
		this.updateFileExplorer();
	}

	onMDChanged(file: TFile, data: string, cache: CachedMetadata) {
		// console.log("onMDChanged(%s)", file.path, file);
		this.manager.updateFileMetadata(file);
	}

	onMDResolve(file: TFile) {
		// console.log("onMDResolve(%s)", file.path, file);
		this.manager.updateFileMetadata(file);
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
			let wFile = this.manager.getFile(file);
			if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
				await this.manager.updateFileWordCountOffline(file);
			}
		} else {
			this.updateFocusedFile();
		}
	}

	onQuickPreview(file: TFile, data: string) {
		//console.log("onQuickPreview()");
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			// console.log("RC>>", Date.now());
			this.debounceRunCount(file, data);
		}
	}

	onFileWordCount(evt: WSFileEvent) {
		// file word count has been updated, what to do?
		// console.log("onFileWordCount()");
		this.updateFileExplorer(evt.info.file);
		// console.log("SV>>", Date.now());
		this.debounceSave();
	}

	onFolderWordCount(evt: WSFolderEvent) {
		// file word count has been updated, what to do?
		// console.log("onFileWordCount()");
		this.updateFileExplorer(evt.info.folder);
		this.debounceSave();
	}

	async RunCount(file: TFile, data: string) {
		// need to have some kind of logging system so people can report the words/ms rate average
		// console.log("<RC>", Date.now());
		await this.manager.updateFileWordCountOnline(file, data);
		// this.logSpeed(words, startTime, endTime);
		//console.log("RunCount() returned %d %s in %d ms", words, words == 1 ? "word" : "words", endTime - startTime);
	}

	updateFileExplorer(file: (WSFile | WSFolder) = null) {
		if (this.fileExplorer instanceof View) {
			if (this.settings.view.showWordCountsInFileExplorer) {
				let container = this.fileExplorer.containerEl;
				container.toggleClass(FILE_EXP_CLASS, true);
				let fileList = this.fileExplorer.fileItems;
				for (let path in fileList) {
					// console.log(path, file?.path, file instanceof WSFile && file.path.contains(path));
					if (file === null || (file !== null && file.path.includes(path))) {
						// console.log("Updating ", path);
						let wFile = this.manager.fileMap.get(path);
						let item = fileList[path];
						if (wFile instanceof WSFile && wFile?.wordCount) {
							item.titleEl.setAttribute(FILE_EXP_DATA_ATTRIBUTE, FormatWords(wFile.wordCount));
						} else {
							let words = path === "/" ? this.manager.root.wordCount : this.manager.folderMap.get(path)?.wordCount;
							if (words) item.titleEl.setAttribute(FILE_EXP_DATA_ATTRIBUTE, FormatWords(words));
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
