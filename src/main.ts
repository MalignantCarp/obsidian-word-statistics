import { App, debounce, Debouncer, Editor, MarkdownView, Modal, Notice, Plugin, TFile } from 'obsidian';
import WordStatsSettingTab from './settings';
import { PluginSettings } from './types';
import { CollectText, CountWords } from './words';

// Remember to rename these classes and interfaces!


const DEFAULT_SETTINGS: PluginSettings = {
	mySetting: 'default'
};

export default class WordStatisticsPlugin extends Plugin {
	public settings: PluginSettings;
	public deb: Debouncer<[file: TFile, data: string]>;

	async onload() {
		console.log("Obsidian Word Statistics.onload()");
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WordStatsSettingTab(this.app, this));

		this.deb = debounce(
			(file: TFile, data: string) => this.RunCount(file, data),
			1000,
			false
		);
		this.registerEvent(
			this.app.workspace.on(
				"quick-preview",
				this.deb,
				this
			));
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

	RunCount(file: TFile, data: string) {
		console.log("RunCount(%s, %s", file, data);
		let [wordText, embedContent] = CollectText(data);
		let words = CountWords(wordText);
		console.log("%d words", words);
	}
}
