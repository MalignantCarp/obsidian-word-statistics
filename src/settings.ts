import { App, PluginSettingTab, Setting } from "obsidian";
import type WordStatisticsPlugin from "./main";
import { WSEvents, WSFolderEvent, WSSettingEvent } from "./model/events";

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
				mode: VIEW_MODE;
			}

			export const DEFAULT: Structure = {
				mode: VIEW_MODE.DEBUG,
			};
		}

		export interface Structure {
			movingTarget: boolean,
			showWordCountsInFileExplorer: boolean,
			statistics: StatisticsPanel.Structure;
		}

		export const DEFAULT: Structure = {
			movingTarget: true,
			showWordCountsInFileExplorer: true,
			statistics: StatisticsPanel.DEFAULT
		};

	}

	export namespace Debug {
		export interface Structure {
			showWordCountSpeed: boolean,
		}

		export const DEFAULT: Structure = {
			showWordCountSpeed: false,
		}
	}

	export namespace Database {
		export interface Structure {
			fileMinify: boolean,
		}

		export const DEFAULT: Structure = {
			fileMinify: true,
		};
	}

	export namespace StatusBar {
		export interface Structure {
			showFileCount: boolean,
			showVaultCount: boolean,
			showParentCount: boolean;
		}

		export const DEFAULT: Structure = {
			showFileCount: true,
			showVaultCount: true,
			showParentCount: true
		};
	}

	export namespace Plugin {
		export interface Structure {
			view: Settings.View.Structure,
			database: Settings.Database.Structure,
			statistics: Settings.Statistics.Structure,
			statusbar: Settings.StatusBar.Structure,
			debug: Settings.Debug.Structure,
		};

		export const DEFAULT: Structure = {
			view: Settings.View.DEFAULT,
			database: Settings.Database.DEFAULT,
			statistics: Settings.Statistics.DEFAULT,
			statusbar: Settings.StatusBar.DEFAULT,
			debug: Settings.Debug.DEFAULT,
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
			.setDesc(`Choose between monitoring word count changes for all files or only in monitored folders (and subfolders). Please note that you can technically set a subfolder is NOT recorded, so be careful. You can monitor recording state from the Progress View, but only for folders with goals. You can always see the current file's recording state from the status bar.`)
			.addDropdown(drop => drop
				.addOption(Settings.Statistics.RECORD.ALL, Settings.Statistics.RECORD.ALL)
				.addOption(Settings.Statistics.RECORD.MONITORED, Settings.Statistics.RECORD.MONITORED)
				.setValue(this.plugin.settings.statistics.record)
				.onChange(async (value) => {
					if (Settings.Statistics.RECORD.ALL == value) { this.plugin.settings.statistics.record = value; }
					else if (Settings.Statistics.RECORD.MONITORED == value) { this.plugin.settings.statistics.record = value; }
					await this.plugin.saveSettings();
					this.plugin.events.trigger(new WSSettingEvent({type: WSEvents.Setting.Recording, data: [value]}, {filter: null}));
				}));
		new Setting(containerEl)
			.setName("Writing Timeout")
			.setDesc("The writing timeout (in seconds) is used to determine the amount of time writing. If you frequently pause while writing, set this to a higher value.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statistics.writingTimeout)
				.setLimits(0, 600, 15)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.statistics.writingTimeout = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Paranoia Mode')
			.setDesc('When enabled, statistics will automatically be backed up to CSV every 1-30 minutes (as set by Paranoia Interval).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statistics.paranoiaMode)
				.onChange(async (value) => {
					this.plugin.settings.statistics.paranoiaMode = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName("Paranoia Interval")
			.setDesc("When Paranoia Mode is enabled, this determines the number of minutes after which the statistics database will be offloaded to CSV.")
			.addSlider(slider => slider
				.setValue(this.plugin.settings.statistics.paranoiaInterval)
				.setLimits(1, 30, 1)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.statistics.paranoiaInterval = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Minify Database')
			.setDesc("If set to true, no whitespace will be added to the database.json file. If set to false, JSON will be more human-readable.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.database.fileMinify)
				.onChange(async (value) => {
					this.plugin.settings.database.fileMinify = value;
					await this.plugin.saveSettings();
					await this.plugin.databaseChangedSave();
				}));
	}

	addStatusBarSettings(containerEl: HTMLElement) {
		containerEl.createEl('h3', { text: "Status Bar Settings" });
		new Setting(containerEl)
			.setName("Show File Word Count")
			.setDesc("When enabled, shows the word count of the currently-focused file in the status bar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statusbar.showFileCount)
				.onChange(async (value) => {
					this.plugin.settings.statusbar.showFileCount = value;
					await this.plugin.saveSettings();
					this.plugin.events.trigger(new WSSettingEvent({type: WSEvents.Setting.StatusBar, data: [value]}, {filter: null}));
				}));
		new Setting(containerEl)
			.setName("Show Parent Word Count")
			.setDesc("When enabled, shows the word count of the currently-focused file's parent folder in the status bar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statusbar.showParentCount)
				.onChange(async (value) => {
					this.plugin.settings.statusbar.showParentCount = value;
					await this.plugin.saveSettings();
					this.plugin.events.trigger(new WSSettingEvent({type: WSEvents.Setting.StatusBar, data: [value]}, {filter: null}));
				}));
		new Setting(containerEl)
			.setName("Show Vault Word Count")
			.setDesc("When enabled, shows the word count of the entire vault in the status bar.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.statusbar.showVaultCount)
				.onChange(async (value) => {
					this.plugin.settings.statusbar.showVaultCount = value;
					await this.plugin.saveSettings();
					this.plugin.events.trigger(new WSSettingEvent({type: WSEvents.Setting.StatusBar, data: [value]}, {filter: null}));
				}));
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Word Statistics Plugin' });

		new Setting(containerEl)
			.setName('Show Word Counts in File Explorer')
			.setDesc('When enabled, the file explorer will have word counts added next to files and folders.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.view.showWordCountsInFileExplorer)
				.onChange(async (value) => {
					this.plugin.settings.view.showWordCountsInFileExplorer = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Moving Target Mode')
			.setDesc('When enabled and there is no word goal set for a file or folder, Progress Bars will have one calculated based on the current word count.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.view.movingTarget)
				.onChange(async (value) => {
					this.plugin.settings.view.movingTarget = value;
					await this.plugin.saveSettings();
					this.plugin.events.trigger(new WSSettingEvent({type: WSEvents.Setting.MovingTarget}, {filter: null}));
				}));

		new Setting(containerEl)
			.setName('Show Word Count Speed Messages')
			.setDesc('When enabled, console will log messages related to how quickly the plugin is counting words. Enable this if you are experiencing performance issues to see if they are related to word counting.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debug.showWordCountSpeed)
				.onChange(async (value) => {
					this.plugin.settings.debug.showWordCountSpeed = value;
					await this.plugin.saveSettings();
				}));

		this.addStatusBarSettings(containerEl);
		this.addStatisticSettings(containerEl);
	}

}
