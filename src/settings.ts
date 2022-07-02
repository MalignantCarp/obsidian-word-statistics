import { App, PluginSettingTab, Setting } from "obsidian";
import type WordStatisticsPlugin from "./main";

export const DEFAULT_TABLE_SETTINGS: WSTableSettings = {
	showNumericIndex: true,
	alphaSortForced: false,
	alphaSortDisplayName: false,
	showFileGoalProgress: true,
	showProjectGoalProgress: true,
	showPathGoalProgress: true,
	showFileShare: true
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
	showWordCountSpeedDebug: true,
	showWordCountsInFileExplorer: true,
	tableSettings: DEFAULT_TABLE_SETTINGS,
	viewSettings: DEFAULT_VIEW_SETTINGS,
	databaseSettings: DEFAULT_DATABASE_SETTINGS,
};

export interface WSPluginSettings {
	useDisplayText: boolean,
	clearEmptyPaths: boolean,
	showWordCountSpeedDebug: boolean,
	showWordCountsInFileExplorer: boolean,
	tableSettings: WSTableSettings,
	viewSettings: WSViewSettings,
	databaseSettings: WSDatabaseSettings;
};

export interface WSTableSettings {
	showNumericIndex: boolean,
	alphaSortForced: boolean,
	alphaSortDisplayName: boolean,
	showFileGoalProgress: boolean,
	showProjectGoalProgress: boolean,
	showPathGoalProgress: boolean,
	showFileShare: boolean;
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

	addDatabaseSettings(containerEl: HTMLElement) {
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

		new Setting(containerEl)
			.setName('Show Word Counts in File Explorer')
			.setDesc('When enabled, the file explorer will have word counts added next to files and folders.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showWordCountsInFileExplorer)
				.onChange(async (value) => {
					this.plugin.settings.showWordCountsInFileExplorer = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName('Show Word Count Speed Messages')
			.setDesc('When enabled, console will log messages related to how quickly the plugin is counting words. Enable this if you are experiencing performance issues to see if they are related to word counting.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showWordCountSpeedDebug)
				.onChange(async (value) => {
					this.plugin.settings.showWordCountSpeedDebug = value;
					await this.plugin.saveSettings();
				}));

		this.addDatabaseSettings(containerEl);
	}

}
