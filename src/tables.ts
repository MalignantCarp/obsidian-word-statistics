
import { App, DropdownComponent, Modal, Setting } from "obsidian";
import { WSDataCollector } from "./data";
import WordStatisticsPlugin from "./main";
import { WSProject, WSProjectManager } from "./projects";
import { WSTableSettings } from "./settings";

export default class ProjectTableModal extends Modal {
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    project: WSProject;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager) {
        super(app);
        this.plugin = plugin;
        this.manager = manager;
        this.project = null;
    }

    isEnter(e: KeyboardEvent) {
        return (e.code === "Enter" && e.shiftKey === false && e.metaKey === false &&
            e.altKey === false && e.ctrlKey === false);
    }

    clear() {
        this.plugin = null;
        this.manager = null;
        this.project = null;

        let { contentEl } = this;
        contentEl.empty();
    }

    getProject() {
        // if there are no projects, this modal cannot be created and a notice is given instead advising there are no projects
        // so this should never return a null value
        if (this.project == null) {
            this.project = this.manager.getProject(this.manager.getProjectNames()[0]); // get the first project in the project manager's list
        }
        return this.project.name;
    }

    onOpen() {
        let { contentEl } = this;

        contentEl.createEl('h2', { text: 'Insert Statistics Table' });
        new Setting(contentEl)
            .setName('Project')
            .setDesc('Select the project for which to generate a table')
            .addDropdown((cb: DropdownComponent) => {
                this.manager.getProjectNames().forEach((proj: string) => {
                    cb.addOption(proj, proj);
                });
                cb.setValue(this.getProject()); // this should never be null
                cb.onChange(async (value: string) => {
                    // value should always be valid as his is a modal, so no changes could be made, this this should never return null
                    this.project = this.manager.getProject(value);
                });
            });
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Insert and close").onClick(async () => {
                    this.close();
                });
            });
    }
}

export function BuildProjectTable(collector: WSDataCollector, settings: WSTableSettings, project: WSProject): string {
    let text = "";

    let files = collector.manager.getProjectList();
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
        if (collector.pluginSettings.useDisplayText) {
            // if (file.getProject() != project) {
            //     // we need to see if there is a special name tied to the backlink to the project

            // }
        }
    }

    return text;
}
