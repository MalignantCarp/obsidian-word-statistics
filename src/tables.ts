import { App, DropdownComponent, Modal, Setting } from "obsidian";
import { WSDataCollector } from "./data";
import WordStatisticsPlugin from "./main";
import { WSProject, WSProjectManager } from "./projects";
import { WSTableSettings } from "./types";

export default class ProjectTableModal extends Modal {
    plugin: WordStatisticsPlugin;
    projects: WSProjectManager;

    constructor(app: App, plugin: WordStatisticsPlugin, projects: WSProjectManager) {
        super(app);
        this.plugin = plugin;
        this.projects = projects
    }

    isEnter(e: KeyboardEvent) {
        return (e.code === "Enter" && e.shiftKey === false && e.metaKey === false &&
            e.altKey === false && e.ctrlKey === false);
    }

    onClose() {
        this.plugin = null;

        let { contentEl } = this;
        contentEl.empty();
    }

    getProject() {
        // we know that when we call this modal, there is at least one project
        // if there isn't, we just create a notice that there are no projects
        let project = "";
        if (this.plugin.tableSettings.project == null) {
            project = this.projects.getProjectNames()[0];
        } else {
            project = this.plugin.tableSettings.project.getName();
        }
        return project;
    }

    onOpen() {
        let { contentEl } = this;

        contentEl.createEl('h2', { text: 'Insert Statistics Table' });

        // we will eventually also want to add a setting to set these as the default settings
        // and to save them for the session. We will need three sets of settings then
        // (default), current, and session. The current settings will be used for tab functions.
        // The current settings can be reset to default. The session settings will be called up
        // by this modal, so if the current settings are saved to session, it will be the same
        // settings loaded next time.

        new Setting(contentEl)
            .setName('Project')
            .setDesc('Select the project for which to generate a table')
            .addDropdown((cb: DropdownComponent) => {
                this.projects.getProjectNames().forEach((proj: string) => {
                    cb.addOption(proj, proj);
                });
                cb.setValue(this.getProject()); // what if this is null?
                cb.onChange(async (value: string) => {
                    this.plugin.tableSettings.project = this.projects.getProjectByName(value);
                    await this.plugin.saveSettings();
                });
            });
        new Setting(contentEl)
            .setName('Display number')
            .setDesc('Show numerical index as first column of table')
            .addToggle(toggle => toggle
                .setValue(this.plugin.tableSettings.showNumber)
                .onChange(async (value: boolean) => {
                    this.plugin.tableSettings.showNumber = value;
                }));
        new Setting(contentEl)
            .setName('Alphanumeric sorting')
            .setDesc('Sort table entries alphabetically instead of by index position')
            .addToggle(toggle => toggle
                .setValue(this.plugin.tableSettings.sortAlpha)
                .onChange(async (value: boolean) => {
                    this.plugin.tableSettings.sortAlpha = value;
                }));
        new Setting(contentEl)
            .setName('Show percentage of whole')
            .setDesc('Show the percentage of words each entry holds to the total words represented by the table')
            .addToggle(toggle => toggle
                .setValue(this.plugin.tableSettings.showShare)
                .onChange(async (value: boolean) => {
                    this.plugin.tableSettings.showShare = value;
                }));
        new Setting(contentEl)
            .setName('Show excluded notes')
            .setDesc('Show notes within the project even if they are not to be counted (with "--" as their counts)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.tableSettings.showExcluded)
                .onChange(async (value: boolean) => {
                    this.plugin.tableSettings.showExcluded = value;
                }));
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Insert and close").onClick(async () => {
                    this.close();
                });
            });
    }
}

export function BuildProjectTable(collector: WSDataCollector, settings: WSTableSettings): string {
    let text = "";

    let project = settings.project;
    let files = collector.projects.getProjectList();
    let bar = "";
    if (settings.showNumber) {
        text += "|  #";
        bar += "|---";
    }
    text += "|Note|Count";
    bar += "|----|-----";
    if (settings.showShare) {
        text += "|Share";
        bar += "|-----";
    }
    text += "|\n";
    bar += "|\n";
    text += bar;

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        // if (file.isCountExcludedFromProject() && !settings.showExcluded) {
        //     continue;
        // }
        // let line = `${settings.showNumber ? `|${i}` : ``}|${collector.getPluginSettings().useDisplayText?`${file.getTitleForProject(project)}`:`${file.getTitle()}`}`;
        // if (settings.showNumber) {
        //     line = "|" + i;
        // }
        if (collector.getPluginSettings().useDisplayText) {
            // if (file.getProject() != project) {
            //     // we need to see if there is a special name tied to the backlink to the project

            // }
        }
    }

    return text;
}