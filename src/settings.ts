import { App, PluginSettingTab, Setting, ValueComponent } from "obsidian";
import type WordStatisticsPlugin from "./main";

export namespace Settings {
	export namespace Statistics {
		export const DAY_LENGTH = 86400000;
		export const PERIOD_LENGTH = 900000;
		export const MINUTE_LENGTH = 60000;

		export enum MONITOR {
			ALL = "All Files",
			PROJECTS = "Project Files Only",
			MONITORED = "Monitored Project Files Only"
		}

		export interface Structure {
			record: MONITOR,
			writingTimeout: number,
		}

		export const DEFAULT: Structure = {
			record: MONITOR.PROJECTS,
			writingTimeout: 120,
		};
	}

	export namespace View {
		export interface Structure {
			treeView: boolean;
		}

		export const DEFAULT: Structure = {
			treeView: true,
		};
	}

	export namespace Table {
		export interface Structure {
			showNumericIndex: boolean,
			alphaSortForced: boolean,
			alphaSortDisplayName: boolean,
			showFileGoalProgress: boolean,
			showProjectGoalProgress: boolean,
			showPathGoalProgress: boolean,
			showFileShare: boolean;
		};

		export const DEFAULT: Structure = {
			showNumericIndex: true,
			alphaSortForced: false,
			alphaSortDisplayName: false,
			showFileGoalProgress: true,
			showProjectGoalProgress: true,
			showPathGoalProgress: true,
			showFileShare: true
		};
	}

	export namespace Database {
		export interface Structure {
			fileMinify: boolean,
			projectMinify: boolean,
			pathMinify: boolean,
			statisticsMinify: boolean,
		}

		export const DEFAULT: Structure = {
			fileMinify: true,
			projectMinify: false,
			pathMinify: false,
			statisticsMinify: true,
		};
	}

	export namespace Plugin {
		export interface Structure {
			useDisplayText: boolean,
			clearEmptyPaths: boolean,
			showWordCountSpeedDebug: boolean,
			showWordCountsInFileExplorer: boolean,
			tableSettings: Settings.Table.Structure,
			viewSettings: Settings.View.Structure,
			databaseSettings: Settings.Database.Structure,
			statisticSettings: Settings.Statistics.Structure;
		};

		export const DEFAULT: Structure = {
			useDisplayText: true,
			clearEmptyPaths: true,
			showWordCountSpeedDebug: true,
			showWordCountsInFileExplorer: true,
			tableSettings: Settings.Table.DEFAULT,
			viewSettings: Settings.View.DEFAULT,
			databaseSettings: Settings.Database.DEFAULT,
			statisticSettings: Settings.Statistics.DEFAULT,
		};
	}
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
			.setName("Monitor")
			.setDesc(`Choose between monitoring word count changes for all files, only files in projects, or only files in projects with "Monitor Word Count" enabled.`)
			.addDropdown(drop => drop
				.addOption(Settings.Statistics.MONITOR.ALL, Settings.Statistics.MONITOR.ALL)
				.addOption(Settings.Statistics.MONITOR.PROJECTS, Settings.Statistics.MONITOR.PROJECTS)
				.addOption(Settings.Statistics.MONITOR.MONITORED, Settings.Statistics.MONITOR.MONITORED)
				.setValue(this.plugin.settings.statisticSettings.record)
				.onChange(async (value) => {
					if (Settings.Statistics.MONITOR.ALL == value) { this.plugin.settings.statisticSettings.record = value; }
					else if (Settings.Statistics.MONITOR.PROJECTS == value) { this.plugin.settings.statisticSettings.record = value; }
					else if (Settings.Statistics.MONITOR.MONITORED == value) { this.plugin.settings.statisticSettings.record = value; }
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Writing Timeout")
			.setDesc("The writing timeout (in seconds) is used to determine the amount of time writing. If you frequently pause while writing, set this to a higher value.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statisticSettings.writingTimeout)
				.setLimits(0, 600, 15)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.writingTimeout = value;
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
