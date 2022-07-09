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
	statisticsMinify: true,
};

export const DEFAULT_STAT_SETTINGS: WStatSettings = {
	writingTimeout: 200,
	recentDays: 365,
	recentSegmentSize: 15,
	historySegmentSize: 4,
	recordProjectsOnly: true,
	consolidateHistory: false,
};

export const DEFAULT_PLUGIN_SETTINGS: WSPluginSettings = {
	useDisplayText: true,
	clearEmptyPaths: true,
	showWordCountSpeedDebug: true,
	showWordCountsInFileExplorer: true,
	tableSettings: DEFAULT_TABLE_SETTINGS,
	viewSettings: DEFAULT_VIEW_SETTINGS,
	databaseSettings: DEFAULT_DATABASE_SETTINGS,
	statisticSettings: DEFAULT_STAT_SETTINGS,
};

export interface WSPluginSettings {
	useDisplayText: boolean,
	clearEmptyPaths: boolean,
	showWordCountSpeedDebug: boolean,
	showWordCountsInFileExplorer: boolean,
	tableSettings: WSTableSettings,
	viewSettings: WSViewSettings,
	databaseSettings: WSDatabaseSettings,
	statisticSettings: WStatSettings;
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
	pathMinify: boolean,
	statisticsMinify: boolean,
}

export interface WSViewSettings {
	treeView: boolean;
}

export interface WStatSettings {
	writingTimeout: number,
	recentDays: number,
	recentSegmentSize: number,
	historySegmentSize: number,
	recordProjectsOnly: boolean,
	consolidateHistory: boolean;
}

export default class WordStatsSettingTab extends PluginSettingTab {
	plugin: WordStatisticsPlugin;

	constructor(app: App, plugin: WordStatisticsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	addStatisticSettings(containerEl: HTMLElement) {
		containerEl.createEl('h3', { text: "Statistics History Settings" });
		new Setting(containerEl)
			.setName("Record Statistics for Projects Only")
			.setDesc("If enabled, word count history records will only be stored for files that are included in projects. Please note that files with pre-existing records that are no longer in projects will continue to have their records.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statisticSettings.recordProjectsOnly)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.recordProjectsOnly = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Writing Timeout")
			.setDesc("The writing timeout (in seconds) is used to determine the amount of time writing. If you frequently pause while writing, set this to a higher value.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statisticSettings.writingTimeout)
				.setLimits(0, 600, 15)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.writingTimeout = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Segment Size (Recent)")
			.setDesc("Word count and writing information is stored in segments of this size (in minutes). The lower the number, the more segments are recorded, though only segments during which there is active writing will be recorded. Use highern umbers to conserve space, or adjust the history consolidation settings.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statisticSettings.recentSegmentSize)
				.setLimits(5, 120, 5)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.recentSegmentSize = value;
					await this.plugin.saveSettings();
				}));
		containerEl.createEl('h4', { text: "History Consolidation" });
		new Setting(containerEl)
			.setName("History Consolidation")
			.setDesc("If enabled, records exceeding RECENT DAYS will be consolidated based on the historical segment size specified.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statisticSettings.consolidateHistory)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.consolidateHistory = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Recent Days")
			.setDesc("The number of days old statistics records can be to be considered recent.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statisticSettings.recentDays)
				.setLimits(1, 365, 1)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.recentDays = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Segment Size (Historical)")
			.setDesc("Word count and writing information is stored in segments of this size (in hours) for historical records if CONSOLIDATE HISTORY is enabled.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statisticSettings.historySegmentSize)
				.setLimits(2, 24, 2)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.historySegmentSize = value;
					await this.plugin.saveSettings();
				}));
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
		new Setting(containerEl)
			.setName('Minify Word Count History Database')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.databaseSettings.statisticsMinify)
				.onChange(async (value) => {
					this.plugin.settings.databaseSettings.statisticsMinify = value;
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
		this.addStatisticSettings(containerEl);
	}

}
