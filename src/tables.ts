import { App, DropdownComponent, Modal, Setting } from "obsidian";
import { Collector } from "./data";
import WordStatisticsPlugin from "./main";
import { WSProject, WSTableSettings } from "./types";

export default class ProjectTableModal extends Modal {
    plugin: WordStatisticsPlugin;
    projects: Map<string, WSProject>;

    constructor(app: App, plugin: WordStatisticsPlugin, projects: WSProject[]) {
        super(app);
        this.plugin = plugin;
        this.projects = new Map<string, WSProject>();
        for (let i = 0; i < projects.length; i++) {
            this.projects.set(projects[i].getName(), projects[i]);
        }
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
            project = this.projects.keys().next().value;
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
                Array.from(this.projects.keys()).forEach((proj: string) => {
                    cb.addOption(proj, proj);
                });
                cb.setValue(this.getProject()); // what if this is null?
                cb.onChange(async (value: string) => {
                    this.plugin.tableSettings.project = this.projects.get(value);
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

export function BuildProjectTable(collector: Collector, settings: WSTableSettings): string {
    let text = "";

    let project = settings.project;
    let files = project.getAllFiles();

    return text;
}