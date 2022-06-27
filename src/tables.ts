
import { App, DropdownComponent, Modal, Setting } from "obsidian";
import type { WSDataCollector } from "./model/collector";
import type WordStatisticsPlugin from "./main";
import { WSFileProject, type WSProject } from "./model/project";
import type { WSTableSettings } from "./settings";
import type { WSProjectManager } from "./model/manager";
import { FormatWordsNumOnly } from './util';

export default class ProjectTableModal extends Modal {
    project: WSProject;

    constructor(public app: App, public plugin: WordStatisticsPlugin, public manager: WSProjectManager, public builder: Function) {
        super(app);
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
            this.project = this.manager.getProjectByID(this.manager.getProjectIDs()[0]); // get the first project in the project manager's list
        }
        return this.project.id;
    }

    onOpen() {
        let { contentEl } = this;

        contentEl.createEl('h2', { text: 'Insert Statistics Table' });
        new Setting(contentEl)
            .setName('Project')
            .setDesc('Select the project for which to generate a table')
            .addDropdown((cb: DropdownComponent) => {
                this.manager.getAllProjects().forEach((proj: WSProject) => {
                    cb.addOption(proj.id, proj.title);
                });
                cb.setValue(this.getProject()); // this should never be null
                cb.onChange(async (value: string) => {
                    // value should always be valid as his is a modal, so no changes could be made, this this should never return null
                    this.project = this.manager.getProjectByID(value);
                });
            });
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Insert and close").onClick(async () => {
                    this.builder(this.project)
                    this.close();
                });
            });
    }
}

export function BuildProjectTable(collector: WSDataCollector, settings: WSTableSettings, project: WSProject): string {
    let text = "";

    let files = project.getFiles();
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

    let projectWords = project.totalWords;

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let name = file.title;
        if (collector.plugin.settings.useDisplayText && project instanceof WSFileProject) {
            name = project.file.getLinkTitle(file) || file.title;
        }
        let share = file.totalWords / projectWords * 100;
        let shareText = share.toFixed(2) + "%";
        text += `| ${i}|${name}| ${FormatWordsNumOnly(file.totalWords)}|`;
        if (settings.showShare) {
            text += ` ${shareText}|\n`;
        } else {
            text += "\n";
        }
    }

    return text;
}
