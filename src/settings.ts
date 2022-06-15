import { App, PluginSettingTab, Setting } from "obsidian";
import type WordStatisticsPlugin from "./main";

export const DEFAULT_TABLE_SETTINGS: WSTableSettings = {
	showNumber: true,
	sortAlpha: false,
	showShare: true,
	showExcluded: true,
};

export const DEFAULT_VIEW_SETTINGS: WSViewSettings = {
	treeView: true,
};

export const DEFAULT_DATABASE_SETTINGS: WSDatabaseSettings = {
	fileMinify: true,
	projectMinify: false,
	pathMinify: false,
};

export const DEFAULT_PLUGIN_SETTINGS: WSPluginSettings = {
	useDisplayText: true,
	clearEmptyPaths: true,
	tableSettings: DEFAULT_TABLE_SETTINGS,
	viewSettings: DEFAULT_VIEW_SETTINGS,
	databaseSettings: DEFAULT_DATABASE_SETTINGS,
};

export interface WSPluginSettings {
	useDisplayText: boolean,
	clearEmptyPaths: boolean,
	tableSettings: WSTableSettings,
	viewSettings: WSViewSettings,
	databaseSettings: WSDatabaseSettings;
};

export interface WSTableSettings {
	showNumber: boolean, // shows a number next to each entry as the primary key
	sortAlpha: boolean, // sorts all entries alphabetically -- ignores index sort
	showShare: boolean, // shorts the percentage of words the note holds of the project's total word count
	showExcluded: boolean, // still shows an file in the table where counting is to be excluded 
};

export interface WSDatabaseSettings {
	fileMinify: boolean,
	projectMinify: boolean,
	pathMinify: boolean;
}

export interface WSViewSettings {
	treeView: boolean;
}

export default class WordStatsSettingTab extends PluginSettingTab {
	plugin: WordStatisticsPlugin;

	constructor(app: App, plugin: WordStatisticsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	showDatabaseSettings(containerEl: HTMLElement) {
		containerEl.createEl('h3', { text: 'Database Settings' });
		containerEl.createEl('p', { text: "These options will help to compact the JSON files used to store the file, project, and path databases. If enabled, no whitespace will be added to leave the JSON file more human readable." });
		new Setting(containerEl)
			.setName('Minify File Database')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.databaseSettings.fileMinify)
				.onChange(async (value) => {
					this.plugin.settings.databaseSettings.fileMinify = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Minify Project Database')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.databaseSettings.projectMinify)
				.onChange(async (value) => {
					this.plugin.settings.databaseSettings.projectMinify = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Minify Path Database')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.databaseSettings.pathMinify)
				.onChange(async (value) => {
					this.plugin.settings.databaseSettings.pathMinify = value;
					await this.plugin.saveSettings();
				}));
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Word Statistics Plugin.' });
		containerEl.createEl('h3', { text: 'Project Index Settings' });

		new Setting(containerEl)
			.setName('Use Display Text')
			.setDesc('If an index file has display text for a link to a project file, use that display text instead of the filename (or title YAML attribute if present).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useDisplayText)
				.onChange(async (value) => {
					this.plugin.settings.useDisplayText = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Clear Empty Paths')
			.setDesc('If there are no projects using a project path, and that project path has been set with goals or other content, remove the path when the last project within is deleted.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.clearEmptyPaths)
				.onChange(async (value) => {
					this.plugin.settings.clearEmptyPaths = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Insert Table Settings' });
		new Setting(containerEl)
			.setName('Display number')
			.setDesc('Show numerical index as first column of table')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.tableSettings.showNumber)
				.onChange(async (value: boolean) => {
					this.plugin.settings.tableSettings.showNumber = value;
				}));
		new Setting(containerEl)
			.setName('Alphanumeric sorting')
			.setDesc('Sort table entries alphabetically for tag-based and folder-based indices.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.tableSettings.sortAlpha)
				.onChange(async (value: boolean) => {
					this.plugin.settings.tableSettings.sortAlpha = value;
				}));
		new Setting(containerEl)
			.setName('Show percentage of whole')
			.setDesc('Show the percentage of words each entry holds to the total words represented by the table')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.tableSettings.showShare)
				.onChange(async (value: boolean) => {
					this.plugin.settings.tableSettings.showShare = value;
				}));
		new Setting(containerEl)
			.setName('Show excluded notes')
			.setDesc('Show notes within the project even if they are not to be counted (with "--" as their counts)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.tableSettings.showExcluded)
				.onChange(async (value: boolean) => {
					this.plugin.settings.tableSettings.showExcluded = value;
				}));
	}

}
