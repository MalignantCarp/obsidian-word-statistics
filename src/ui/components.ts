import { App, ButtonComponent, ExtraButtonComponent, Setting } from "obsidian";
import type WordStatisticsPlugin from "src/main";
import { WSFile } from "src/model/file";
import type { WSProjectGroup } from "src/model/group";
import { CanProjectMoveDownInGroup, CanProjectMoveUpInGroup, WSProjectManager } from "src/model/manager";
import { PROJECT_TYPE_STRING, WSFileProject, WSFolderProject, WSProject, WSPType, WSTagProject } from "src/model/project";
import { EditFileProjectModal, EditFolderProjectModal, EditTagProjectModal } from "./modals";

/*
[TODO]
This can probably be broken into three components:

The encapsulating ProjectElement and the FileList and FileItem components.
This will allow us the best flexibility in terms of generating the HTMLElements.
*/

export class FileWordCountElement extends HTMLDivElement {
    constructor(public plugin: WordStatisticsPlugin, public parent: HTMLElement, public file: WSFile) {
        super();
        this.parent.append(this);
        this.onemptied = () => {

        }
    }
}

export class ProjectFileItem {
    public container: HTMLDivElement;
    public name: HTMLDivElement;
    public words: HTMLDivElement;

    constructor(public plugin: WordStatisticsPlugin, public parent: HTMLElement, public file: WSFile, public project?: WSProject) {
        this.container = this.parent.createDiv({ cls: ["ws-project-file", "ws-table-row"] });
        this.name = this.container.createDiv({ cls: ["ws-project-file-name", "ws-table-cell"] });
        this.words = this.container.createDiv({ cls: ["ws-project-file-words", "ws-table-cell"] });
        this.update();
    }

    clear() {
        this.words = null;
        this.name = null;
        this.container.empty();
        this.container = null;
        this.file = null;
        this.project = null;
        this.plugin = null;
        this.parent = null;
    }

    update() {
        let indexed = this.project != null && this.project != undefined && this.project.type == WSPType.File;
        let fp: WSFileProject;
        if (indexed) {
            fp = this.project as WSFileProject;
        }
        let fileName = this.plugin.settings.useDisplayText ? this.file.title : this.file.name;
        if (indexed) {
            fileName = fp.file.getLinkTitle(this.file);
        }
        this.name.setText(fileName);
        this.words.setText(Intl.NumberFormat().format(this.file.words) + (this.file.words === 1 ? " word" : " words"));
    }
}

export class ProjectFileList {
    public container: HTMLDivElement;
    public header: HTMLDivElement;
    public headerName: HTMLDivElement;
    public tableBody: HTMLDivElement;
    public headerWords: HTMLDivElement;
    public footer: HTMLDivElement;
    public footerName: HTMLDivElement;
    public footerWords: HTMLDivElement;
    public items: ProjectFileItem[];
    public itemMap: Map<WSFile, ProjectFileItem> = new Map<WSFile, ProjectFileItem>();

    constructor(public app: App, public plugin: WordStatisticsPlugin, public manager: WSProjectManager, public parent: HTMLElement, public project: WSProject) {
        this.container = this.parent.createDiv({ cls: ["ws-project", "ws-table"] });
        this.header = this.container.createDiv({ cls: "ws-table-header" });
        this.headerName = this.header.createDiv({ text: "File Name", cls: "ws-header-cell" });
        this.headerWords = this.header.createDiv({ text: "Words", cls: "ws-header-cell" });
        this.tableBody = this.container.createDiv({ cls: "ws-table-body" });
        this.footer = this.container.createDiv({ cls: "ws-table-footer" });
        this.footerName = this.footer.createDiv({ text: "Total Words", cls: "ws-footer-cell" });
        this.footerWords = this.footer.createDiv({ cls: "ws-footer-cell" });
        this.update();
        // this.plugin.registerEvent(this.app.workspace.on("word-statistics-file-word-count", this.update.bind(this)));
        // this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-files-update", this.onProjectUpdate.bind(this)));
    }

    onProjectUpdate(project: WSProject) {
        if (project == this.project) {
            this.itemMap.clear();
            while(this.items.length > 0) {
                this.items.pop().clear();
                this.tableBody.empty();
                this.update();
            }
        }
    }

    clear() {
        while (this.items.length > 0) {
            this.items.pop().clear();
        }
        this.container.empty();
        this.container = null;
        this.header = null;
        this.headerName = null;
        this.headerWords = null;
        this.tableBody = null;
        this.footer = null;
        this.footerName = null;
        this.footerWords = null;
    }

    update(file?: WSFile) {
        if (file instanceof WSFile) {
            if (this.itemMap.has(file)) {
                this.itemMap.get(file).update();
            }
        } else {

        }
        this.footerWords.setText(Intl.NumberFormat().format(this.project.totalWords) + (this.project.totalWords === 1 ? " word" : " words"));
    }
}

export class ProjectElement {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLElement;
    edit: Setting;
    info: HTMLElement;
    name: HTMLElement;
    words: HTMLElement;
    fileList: HTMLDetailsElement;
    table: HTMLElement;
    files: Map<string, [HTMLElement, HTMLElement, HTMLElement]>;
    project: WSProject;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement, project: WSProject) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.project = project;
        this.parent = parent;
        this.container = parent.createDiv({ cls: "project" });
        this.info = this.container.createDiv({ cls: "project-info" });
        //this.name = this.info.createDiv({ cls: "project-name" }).createEl("p", { text: project.name });
        let words = project.totalWords;
        //this.words = this.info.createDiv({ cls: "project-words" }).createEl("p", { text: Intl.NumberFormat().format(words) + (words === 1 ? " word" : " words") });
        this.fileList = this.container.createEl("details", { cls: "project" });
        this.name = this.fileList.createEl("summary", { cls: "project-name", text: project.name });
        this.table = this.fileList.createEl("table");
        this.files = new Map<string, [HTMLElement, HTMLElement, HTMLElement]>();
        this.rebuildTableFromProject();
    }

    rebuildTableFromProject() {
        this.table.empty();
        this.files.clear();
        let files: WSFile[];
        let indexed = this.project.type == WSPType.File;
        let fp: WSFileProject = null;
        if (indexed) {
            fp = this.project as WSFileProject;
        }
        if (this.plugin.settings.tableSettings.sortAlpha && !indexed) {
            files = Array.from(this.project.files).sort(((a, b) => (a.path > b.path) ? 1 : ((b.path > a.path) ? -1 : 0)));
        } else {
            files = this.project.files;
        }
        files.forEach((file) => {
            let row = this.table.createEl("tr");
            let fileName = this.plugin.settings.useDisplayText ? file.title : file.name;
            if (indexed) {
                fileName = fp.file.getLinkTitle(file);
            }
            let fName = row.createEl("td", { cls: "file-name", text: fileName });
            let words = row.createEl("td", { cls: "file-words", text: Intl.NumberFormat().format(file.words) + (file.words === 1 ? " word" : " words") });
            this.files.set(file.path, [row, fName, words]);
        });
        let row = this.table.createEl("tr", { cls: "total-line" });
        let fName = row.createEl("td", { cls: "file-total", text: "" });
        let words = row.createEl("td", { cls: "project-words", text: Intl.NumberFormat().format(this.project.totalWords) + (this.project.totalWords === 1 ? " word" : " words") });
        this.files.set(null, [row, fName, words]);
    }

    update() {
        this.name.setText(this.project.name);
        //this.words.setText(Intl.NumberFormat().format(this.project.totalWords));
        this.project.files.forEach((file) => {
            if (!this.files.has(file.path)) {
                this.rebuildTableFromProject();
                return;
            }
            let [row, name, words] = this.files.get(file.path);
            words.setText(Intl.NumberFormat().format(file.words) + (file.words === 1 ? " word" : " words"));
        });
        let [row, name, words] = this.files.get(null);
        words.setText(Intl.NumberFormat().format(this.project.totalWords) + (this.project.totalWords === 1 ? " word" : " words"));
    }
}

/*
[TODO]
There is room to re-use some of this code, so perhaps break this down a little bit.
The potential re-use is to add projects to the project group. Much of the code is already here,
so with a bit of refinement, we can reduce code duplication.
*/
export class ProjectList {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    type: WSPType;
    parent: HTMLElement;
    container: HTMLDivElement;
    projects: Map<WSProject, HTMLElement>;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement, type: WSPType) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.container = parent.createDiv({ cls: "project-list" });
        this.type = type;
        this.projects = new Map<WSProject, HTMLElement>();
        this.rebuildProjects();
    }

    clean() {
        this.app = null;
        this.plugin = null;
        this.manager = null;
        this.parent = null;
        this.container.empty();
        this.container = null;
        this.type = null;
        this.projects.clear();
        this.projects = null;
    }

    rebuildProjects() {
        const projects = this.manager.getProjectsByType(this.type);
        this.container.empty();
        projects.forEach((project) => {
            let setting = new Setting(this.container);
            setting.setName(project.name);
            setting.addExtraButton((button) => {
                button.setIcon("pencil").setTooltip("Edit Project");
                button.onClick(() => {
                    let modal: any;
                    switch (project.type) {
                        case WSPType.File:
                            modal = new EditFileProjectModal(this.app, this.plugin, this.manager, project as WSFileProject);
                            break;
                        case WSPType.Folder:
                            modal = new EditFolderProjectModal(this.app, this.plugin, this.manager, project as WSFolderProject);
                            break;
                        case WSPType.Tag:
                            modal = new EditTagProjectModal(this.app, this.plugin, this.manager, project as WSTagProject);
                            break;
                    }
                    if (modal === undefined || modal === null) {
                        console.error(`Failed to create modal for project '${project.name} of type ${project.type}/${PROJECT_TYPE_STRING[project.type]}`);
                        return;
                    }
                    modal.onClose = () => {
                        if (modal.cancelled) {
                            return;
                        }
                        if (modal.nameChanged || modal.changed || modal.new) {
                            this.manager.triggerProjectUpdate(project);
                            this.rebuildProjects();
                            return;
                        }
                    };
                    modal.open();
                });
            });
            setting.addExtraButton((button) => {
                button.setIcon("trash").setTooltip("Delete project.");
                button.onClick(() => {
                    this.manager.deleteProject(project);
                    this.manager.triggerProjectUpdate(project);
                    this.rebuildProjects();
                });
            });
        });
    }
}

/*
This component represents a single project within a project group. It allows for the removal of the project or movement of the project
up or down through the group by feeding in the necessary callback functions.
*/
export class ProjectGroupProjectItem {
    container: HTMLDivElement;
    setting: Setting;
    private up: ExtraButtonComponent;
    private down: ExtraButtonComponent;

    constructor(
        public parent: HTMLElement,
        public group: WSProjectGroup,
        public project: WSProject,
        private moveUpCB: Function,
        private moveDownCB: Function,
        private trashCB: Function
    ) {
        this.container = parent.createDiv();
        this.setting = new Setting(this.container);
        this.setting.addExtraButton((button) => {
            this.up = button;
            button.setIcon('up-arrow');
            button.setDisabled(CanProjectMoveUpInGroup(this.project, this.group));
            button.onClick(() => {
                this.moveUpCB(this);
                button.setDisabled(CanProjectMoveUpInGroup(this.project, this.group));
            });
        });
        this.setting.addExtraButton((button) => {
            this.down = button;
            button.setIcon('down-arrow');
            button.setDisabled(CanProjectMoveDownInGroup(this.project, this.group));
            button.onClick(() => {
                this.moveDownCB(this);
                button.setDisabled(CanProjectMoveDownInGroup(this.project, this.group));
            });
        });
        this.setting.addExtraButton((button) => {
            button.setIcon('trash');
            button.onClick(() => {
                this.trashCB(this);
            });
        });
    }

    clean() {
        this.setting.clear();
        this.setting = null;
        this.container.empty();
        this.container = null;
        this.parent = null;
        this.project = null;
        this.group = null;
        this.moveDownCB = null;
        this.moveUpCB = null;
        this.trashCB = null;
    }

    update() {
        this.setting.setName(this.project.name);
        this.up.setDisabled(CanProjectMoveUpInGroup(this.project, this.group));
        this.down.setDisabled(CanProjectMoveDownInGroup(this.project, this.group));
    }
}

/*
This component represents a project group in that it contains the respective items representing the projects
within that group.
*/
export class ProjectGroupItem {
    headContainer: HTMLDivElement;
    container: HTMLDivElement;
    setting: Setting;
    private projects: ProjectGroupProjectItem[];

    constructor(private manager: WSProjectManager, private group: WSProjectGroup, public parent: HTMLElement) {
        this.headContainer = parent.createDiv();
        this.container = parent.createDiv();
        this.setting = new Setting(this.headContainer);
        this.setting.setName("Projects");
        this.setting.setDesc("This is where you can add projects to a project group.");
        this.setting.addButton((button) => {
            // [TODO] This needs to be completed
        });
    }

    clean() {
        this.setting.clear();
        this.setting = null;
        this.headContainer.empty();
        this.headContainer = null;
        this.container.empty();
        this.container = null;
        while (this.projects.length > 0) {
            this.projects.pop().clean();
        }
    }

    moveItemUp(item: ProjectGroupProjectItem) {
        if (CanProjectMoveUpInGroup(item.project, item.group)) {
            let index = this.projects.indexOf(item);
            console.log("Up IN:", index, this.group.projects.indexOf(item.project));
            this.manager.moveProjectUpInGroup(item.project, item.group);
            let previousItem = this.projects[index - 1];
            this.container.insertBefore(item.container, previousItem.container);
            this.projects.remove(item);
            this.projects.splice(index - 1, 0, item);
            console.log("Up OUT:", this.projects.indexOf(item), this.group.projects.indexOf(item.project));
        }
    }

    moveItemDown(item: ProjectGroupProjectItem) {
        if (CanProjectMoveDownInGroup(item.project, item.group)) {
            let index = this.projects.indexOf(item);
            console.log("Down IN:", index, this.group.projects.indexOf(item.project));
            this.manager.moveProjectDownInGroup(item.project, item.group);
            let nextItem = this.projects[index + 1];
            this.container.insertBefore(item.container, nextItem.container);
            this.projects.remove(item);
            this.projects.splice(index + 1, 0, item);
            console.log("Down OUT:", this.projects.indexOf(item), this.group.projects.indexOf(item.project));
        }
    }

    trashItem(item: ProjectGroupProjectItem) {
        this.container.removeChild(item.container);
        this.manager.removeProjectFromGroup(item.project, item.group);
        this.projects.remove(item);
    }

    populateGroup() {
        while (this.projects.length > 0) {
            this.projects.pop();
        }
        this.container.empty();
        this.manager.getProjectsForGroupName(this.group.name).forEach((project) => {
            this.projects.push(new ProjectGroupProjectItem(this.container, this.group, project, this.moveItemUp.bind(this), this.moveItemDown.bind(this), this.trashItem.bind(this)));
        });
    }

}