import { App, PluginSettingTab, Setting } from "obsidian";
import WordStatisticsPlugin from "./main";
import { WSPluginSettings, WSTableSettings } from "./types";

export const DEFAULT_TABLE_SETTINGS: WSTableSettings = {
	showNumber: true,
	sortAlpha: false,
	showShare: true,
	showExcluded: true,
	project: null
};

export const DEFAULT_PLUGIN_SETTINGS: WSPluginSettings = {
	useDisplayText: true,
	defaultTableSettings: DEFAULT_TABLE_SETTINGS,
};

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
		containerEl.createEl('h3', { text: 'Table Settings' });

	}
}
