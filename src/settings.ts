import { App, PluginSettingTab, Setting } from "obsidian";
import { WSFileRef } from "./files";
import WordStatisticsPlugin from "./main";
import { WSProject, WSProjectMap } from "./projects";

export const DEFAULT_TABLE_SETTINGS: WSTableSettings = {
	showNumber: true,
	sortAlpha: false,
	showShare: true,
	showExcluded: true,
};

export const DEFAULT_PLUGIN_SETTINGS: WSPluginSettings = {
	useDisplayText: true,
	tableSettings: DEFAULT_TABLE_SETTINGS,
	projects: [],
};

export interface WSPluginSettings {
	useDisplayText: boolean;
	tableSettings: WSTableSettings;
	projects: WSProjectMap[];
}

export interface WSTableSettings {
	showNumber: boolean; // shows a number next to each entry as the primary key
	sortAlpha: boolean; // sorts all entries alphabetically -- ignores index sort
	showShare: boolean; // shorts the percentage of words the note holds of the project's total word count
	showExcluded: boolean; // still shows an file in the table where counting is to be excluded 
}

export default class WordStatsSettingTab extends PluginSettingTab {
	plugin: WordStatisticsPlugin;

	constructor(app: App, plugin: WordStatisticsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
			.setDesc('Sort table entries alphabetically instead of by index position')
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
