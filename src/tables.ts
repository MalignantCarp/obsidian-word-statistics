
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
                    this.builder(this.project);
                    this.close();
                });
            });
    }
}

interface IProjectTableRow {
    noteTitle: string,
    noteDisplayText: string;
    words: number,
    fileGoal: number,
    percentOfFileGoal: number,
    percentOfProject: number,
    percentOfProjectGoal: number,
    percentOfPathGoal: number;
}

const HEADER_PROJECT_TABLE = {
    noteTitle: "Note Title",
    words: "Word Count",
    percentOfFileGoal: "% Complete",
    percentOfProject: "Project %",
    percentOfProjectGoal: "% Project Goal",
    percentOfPathGoal: "% Path Goal"
};

export function BuildProjectTableRows(manager: WSProjectManager, project: WSProject) {
    let files = project.getFiles();
    let rows: IProjectTableRow[] = [];

    for (let file of files) {
        let words = file.totalWords;
        let fileGoal = manager.getWordGoalForFileByContext(file, project);
        let projectGoal = manager.getWordGoalForProjectByContext(project);
        let pathGoal = manager.getWordGoalForPath(manager.getPath(project.path));

        rows.push({
            noteTitle: file.title,
            noteDisplayText: project instanceof WSFileProject ? project.file.getLinkTitle(file) || file.title : file.title,
            words,
            fileGoal,
            percentOfFileGoal: fileGoal ? words / fileGoal * 100 : undefined,
            percentOfProject: words > 0 ? words / project.totalWords * 100 : 0,
            percentOfProjectGoal: projectGoal ? words / projectGoal * 100 : undefined,
            percentOfPathGoal: pathGoal ? words / pathGoal * 100 : undefined

        });
    }
    return rows;
}

export function BuildProjectTable(collector: WSDataCollector, settings: WSTableSettings, project: WSProject): string {
    let rows = BuildProjectTableRows(collector.manager, project);
    let text = "|";
    let bar = "|";

    let lines: string[] = [];

    if (settings.showNumericIndex) {
        text += ` # |`;
        bar += "---:|";
    }
    text += `${HEADER_PROJECT_TABLE.noteTitle}|${HEADER_PROJECT_TABLE.words}|`;
    bar += "-----|-----:|";
    if (settings.showFileGoalProgress) {
        text += `${HEADER_PROJECT_TABLE.percentOfFileGoal}|`;
        bar += "-----:|";
    }
    if (settings.showFileShare) {
        text += `${HEADER_PROJECT_TABLE.percentOfProject}|`;
        bar += "-----:|";
    }
    lines.push(text);
    lines.push(bar);
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        text = "|";
        if (settings.showNumericIndex) {
            text += `${i}|`;
        }
        text += `${collector.plugin.settings.useDisplayText ? row.noteDisplayText : row.noteTitle}|${FormatWordsNumOnly(row.words)}|`;
        if (settings.showFileGoalProgress) {
            text += `${row.percentOfFileGoal === undefined ? '--' : row.percentOfFileGoal.toFixed(2) + "%"}|`
        }
        if (settings.showFileShare) {
            text += `${row.percentOfProject.toFixed(2) + "%"}|`
        }
        lines.push(text)
    }
    return lines.join("\n");
}
