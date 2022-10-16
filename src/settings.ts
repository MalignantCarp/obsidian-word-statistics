import { App, PluginSettingTab, Setting } from "obsidian";
import type WordStatisticsPlugin from "./main";

export namespace Settings {
	export namespace Statistics {
		export const DAY_LENGTH = 86400000; // 86,400 seconds / 24 hours
		export const PERIOD_LENGTH = 900000; // 900 seconds / 15 minutes
		export const MINUTE_LENGTH = 60000; // 60 seconds

		export enum RECORD {
			ALL = "All Files",
			MONITORED = "Monitored Folders Only"
		}

		export interface Structure {
			record: RECORD,
			writingTimeout: number,
			paranoiaMode: boolean,
			paranoiaInterval: number,
		}

		export const DEFAULT: Structure = {
			record: RECORD.MONITORED,
			writingTimeout: 120,
			paranoiaMode: false,
			paranoiaInterval: 5,
		};
	}

	export namespace View {
		export namespace StatisticsPanel {
			export enum VIEW_MODE {
				DEBUG = "Debug",
				DAY = "Day"
			}

			export interface Structure {
				viewMode: VIEW_MODE;
			}

			export const DEFAULT: Structure = {
				viewMode: VIEW_MODE.DEBUG
			};
		}

		export interface Structure {
			statistics: StatisticsPanel.Structure;
		}

		export const DEFAULT: Structure = {
			statistics: StatisticsPanel.DEFAULT
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
		}

		export const DEFAULT: Structure = {
			fileMinify: true,
		};
	}

	export namespace Plugin {
		export interface Structure {
			showWordCountSpeedDebug: boolean,
			showWordCountsInFileExplorer: boolean,
			tableSettings: Settings.Table.Structure,
			viewSettings: Settings.View.Structure,
			databaseSettings: Settings.Database.Structure,
			statisticSettings: Settings.Statistics.Structure;
		};

		export const DEFAULT: Structure = {
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
				.addOption(Settings.Statistics.RECORD.ALL, Settings.Statistics.RECORD.ALL)
				.addOption(Settings.Statistics.RECORD.MONITORED, Settings.Statistics.RECORD.MONITORED)
				.setValue(this.plugin.settings.statisticSettings.record)
				.onChange(async (value) => {
					if (Settings.Statistics.RECORD.ALL == value) { this.plugin.settings.statisticSettings.record = value; }
					else if (Settings.Statistics.RECORD.MONITORED == value) { this.plugin.settings.statisticSettings.record = value; }
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
		new Setting(containerEl)
			.setName('Paranoia Mode')
			.setDesc('When enabled, statistics will automatically be backed up to CSV every 1-30 minutes (as set by Paranoia Interval).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statisticSettings.paranoiaMode)
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.paranoiaMode = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Paranoia Interval")
			.setDesc("When Paranoia Mode is enabled, this determines the number of minutes after which the statistics database will be offloaded to CSV.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statisticSettings.paranoiaInterval)
				.setLimits(1, 30, 1)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.statisticSettings.paranoiaInterval = value;
					await this.plugin.saveSettings();
				}));
	}

	addDatabaseSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName('Minify Database')
			.setDesc("If set to true, no whitespace will be added to the database.json file. If set to false, JSON will be more human-readable.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.databaseSettings.fileMinify)
				.onChange(async (value) => {
					this.plugin.settings.databaseSettings.fileMinify = value;
					await this.plugin.saveSettings();
					this.plugin.debounceSave();
				}));
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Word Statistics Plugin.' });
		containerEl.createEl('h3', { text: 'Project Index Settings' });

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
