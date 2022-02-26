import { App, debounce, Debouncer, MarkdownView, Plugin, TFile, WorkspaceLeaf, MetadataCache, Vault, MarkdownPreviewView } from 'obsidian';
import { Collector } from './data';
import WordStatsSettingTab from './settings';
import { PluginSettings } from './types';
import { FindRawText } from './util';
import { WordCountForText } from './words';


const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default'
};

export default class WordStatisticsPlugin extends Plugin {
	public settings: PluginSettings;
	public debouncerWC: Debouncer<[file: TFile, data: string]>;
	public wordsPerMS: number[] = [];
	private statusBar: HTMLElement;
	private collector: Collector;
	private hudLastUpdate: number = 0;

	async onload() {
		console.log("Obsidian Word Statistics.onload()");
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));
		this.collector = new Collector(this.app.vault, this.app.metadataCache);
		await this.collector.ScanVault();

		this.debouncerWC = debounce(
			(file: TFile, data: string) => this.RunCount(file, data),
			200,
			false
		);
		// there has to be a better event to hook onto here, this seems silly
		this.registerEvent(this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this)));
		this.registerEvent(this.app.workspace.on("active-leaf-change", this.onLeafChange.bind(this)));
		this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen.bind(this)));
		this.registerEvent(this.app.vault.on("rename", this.onFileRename.bind(this)));

		this.registerInterval(window.setInterval(this.onInterval.bind(this), 500));

		// in order to track selection and offer word counting for selection, will need to extend code mirror and look out for relevant state changes
		// for now, the code works as far as counting words in the current context.

		this.statusBar = this.addStatusBarItem();
	}

	onunload() {
		console.log("Obsidian Word Statistics.onunload()");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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

	updateStatusBar() {
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);

		let path = view.file.path;
		let projects = this.collector.getProjectsFromPath(path);
		let words = this.collector.GetWords(path);
		let totalWords = this.collector.getTotalWords();

		// **Is this valid for mobile?**
		let wordStr = Intl.NumberFormat().format(words) + " / " + Intl.NumberFormat().format(totalWords);
		this.statusBar.setText(wordStr + " " + (totalWords == 1 ? "word" : "words"));
		this.hudLastUpdate = Date.now();
	}

	onFileRename(file: TFile, data: string) {
		console.log("'%s' renamed to '%s'", data, file.path);
		this.collector.onRename(file, data);
	}

	onLeafChange(leaf: WorkspaceLeaf) {
		console.log("onLeafChange(%s)", leaf.view.getViewType());
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
			this.debouncerWC(file, await this.app.vault.cachedRead(file));
		}
	}

	onQuickPreview(file: TFile, data: string) {
		//console.log("onQuickPreview()");
		if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
			this.debouncerWC(file, data);
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
