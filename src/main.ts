import { setDefaultResultOrder } from 'dns';
import { App, debounce, Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, MetadataCache, Vault, MarkdownPreviewView, TAbstractFile, Notice } from 'obsidian';
import { WSDataCollector } from './data';
import WordStatsSettingTab, { DEFAULT_PLUGIN_SETTINGS, DEFAULT_TABLE_SETTINGS } from './settings';
import ProjectTableModal, { BuildProjectTable } from './tables';
import { WSPluginSettings, WSTableSettings } from './types';
import { WordCountForText } from './words';

export default class WordStatisticsPlugin extends Plugin {
	public settings: WSPluginSettings;
	public debounceRunCount: Debouncer<[file: TFile, data: string]>;
	public wordsPerMS: number[] = [];
	private statusBar: HTMLElement;
	private collector: WSDataCollector;
	private hudLastUpdate: number = 0;

	async onload() {
		console.log("Obsidian Word Statistics.onload()");
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));
		this.collector = new WSDataCollector(this, this.app.vault, this.app.metadataCache);
		await this.collector.ScanVault();

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

		this.registerInterval(window.setInterval(this.onInterval.bind(this), 500));

		// in order to track selection and offer word counting for selection, will need to extend code mirror and look out for relevant state changes
		// for now, the code works as far as counting words in the current context.

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
		await this.collector.ProcessQueuedItems();
		if (this.hudLastUpdate < this.collector.getLastUpdate()) {
			this.updateStatusBar();
		}
	}

	insertProjectTableModal() {
		if (this.collector.projects.getProjectsCount() > 0) {
			let projects = this.collector.projects;
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
			let totalWords = this.collector.getTotalWords();

			// **Is this valid for mobile?**
			let wordStr = Intl.NumberFormat().format(words) + " / " + Intl.NumberFormat().format(totalWords);
			this.statusBar.setText(wordStr + " " + (totalWords == 1 ? "word" : "words"));
		} else {
			let totalWords = this.collector.getTotalWords();
			let wordStr = Intl.NumberFormat().format(totalWords);
			this.statusBar.setText(wordStr + " " + (totalWords == 1 ? "word" : "words") + " in vault.");
		}
		this.hudLastUpdate = Date.now();
	}

	onFileRename(file: TAbstractFile, data: string) {
		// console.log("'%s' renamed to '%s'", data, file.path);
		if (file.path.search(/(.*)(\.md)/) >= 0) {
			this.collector.onRename(file, data);
		}
	}

	onFileDelete(file: TAbstractFile, data: string) {
		// console.log("'%s' deleted.", file.path);
		if (file.path.search(/(.*)(\.md)/) >= 0) {
			this.collector.onDelete(file);
		}
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

	RunCount(file: TFile, data: string) {
		// need to have some kind of logging system so people can report the words/ms rate average
		let startTime = Date.now();
		let words = WordCountForText(data);
		let endTime = Date.now();
		this.logSpeed(words, startTime, endTime);
		this.collector.UpdateFile(file);
		this.collector.LogWords(file.path, words);
		//console.log("RunCount() returned %d %s in %d ms", words, words == 1 ? "word" : "words", endTime - startTime);
		this.updateStatusBar();
	}
}
