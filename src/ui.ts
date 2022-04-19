import { App, ButtonComponent, Modal, Notice, Setting, TextComponent, TFile, TFolder } from "obsidian";
import { WSPErrors } from "./errors";
import WordStatisticsPlugin from "./main";
import { PROJECT_TYPE_NAME, PROJECT_TYPE_STRING, WSFileProject, WSFolderProject, WSProject, WSProjectManager, WSPType, WSTagProject } from "./projects";
import FileSuggestionModal from "./suggester/file";
import { FolderSuggestionModal } from "./suggester/folder";
import { TagSuggestionModal } from "./suggester/tag";

abstract class ProjectModal<T> extends Modal {
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    project: T;
    readonly type: WSPType;
    errors: Map<string, boolean>;
    nameObject: TextComponent;
    cancelled: boolean = true;
    changed: boolean = false;
    new: boolean = false;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: T) {
        super(app);
        this.plugin = plugin;
        this.manager = manager;
        this.type = this.getProjectType();
        this.project = project || null;
        if (this.project === null) {
            this.new = true;
        }
        this.errors = new Map<string, boolean>();
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

    abstract additionalUI(containerEl: HTMLElement): void;
    abstract updateIndex(): void;
    abstract createProjectObject(): void;
    abstract getProjectName(): string;
    abstract getProjectType(): WSPType;
    abstract renameProject(): void;

    onOpen() {
        let { contentEl } = this;
        if (this.project != null) {
            contentEl.createEl('h2', { text: `Modify ${PROJECT_TYPE_NAME[this.type]}` });
        } else {
            contentEl.createEl('h2', { text: `Create ${PROJECT_TYPE_NAME[this.type]}` });
        }
        new Setting(contentEl)
            .setName('Project Name')
            .setDesc('The name of the project (must be unique)')
            .addText((tc: TextComponent) => {
                this.nameObject = tc;
                if (this.project != null) {
                    this.nameObject.setValue(this.getProjectName());
                }
                this.nameObject.onChange((v) => {
                    v = v.trim();
                    if (!this.manager.checkProjectName(v) && (this.getProjectName() != v)) {
                        this.errors.set(WSPErrors.PROJECT_NAME_INVALID, true);
                        ProjectModal.SetValidationError(this.nameObject, WSPErrors.MESSAGE.PROJECT_NAME_INVALID);
                        return;
                    } else {
                        this.errors.set(WSPErrors.PROJECT_NAME_INVALID, false);
                        ProjectModal.RemoveValidationError(this.nameObject);
                    }
                    if (!v.length) {
                        this.errors.set(WSPErrors.PROJECT_NAME_BLANK, true);
                        ProjectModal.SetValidationError(this.nameObject, WSPErrors.MESSAGE.PROJECT_NAME_BLANK);
                        return;
                    } else {
                        this.errors.set(WSPErrors.PROJECT_NAME_BLANK, false);
                        ProjectModal.RemoveValidationError(this.nameObject);
                    }
                });
            });
        this.additionalUI(contentEl);
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Save").onClick(async () => {
                    let errorState = false;
                    let errors: string[] = [];
                    this.errors.forEach((v, k) => {
                        if (v) {
                            errorState = true;
                            errors.push(k);
                        }
                    });
                    // console.log(errors);
                    if (errorState) {
                        new Notice(WSPErrors.MESSAGE.PROJECT_VALIDATION);
                    } else {
                        this.cancelled = false;
                        if (this.new) {
                            this.createProjectObject();
                        } else {
                            if (this.getProjectName() != this.nameObject.getValue()) {
                                this.renameProject();
                            }
                            if (this.changed) {
                                this.updateIndex();
                            }
                        }
                        this.close();
                    }
                });
            })
            .addButton((button) => {
                button.setButtonText("Cancel").onClick(() => {
                    this.cancelled = true;
                    this.close();
                });
            });
    }

    /*
    static validation methods borrowed from Admonitions plugin by Jeremy Valentine used under MIT License (see LICENSE).
    https://github.com/valentine195/obsidian-admonition
    src/settings.ts retrieved April 14, 2022.
    */

    static SetValidationError(textInput: TextComponent, message?: string) {
        textInput.inputEl.addClass("is-invalid");
        if (message) {
            textInput.inputEl.parentElement.addClasses([
                "has-invalid-message",
                "unset-align-items"
            ]);
            textInput.inputEl.parentElement.parentElement.addClass(".unset-align-items");
            let mDiv = textInput.inputEl.parentElement.querySelector(".invalid-feedback") as HTMLDivElement;
            if (!mDiv) {
                mDiv = createDiv({ cls: "invalid-feedback" });
            }
            mDiv.innerText = message;
            mDiv.insertAfter(textInput.inputEl);
        }
    }

    static RemoveValidationError(textInput: TextComponent) {
        textInput.inputEl.removeClass("is-invalid");
        textInput.inputEl.parentElement.removeClasses([
            "has-invalid-message",
            "unset-align-items"
        ]);
        textInput.inputEl.parentElement.parentElement.removeClass(".unset-align-items");

        if (textInput.inputEl.parentElement.querySelector(".invalid-feedback")) {
            textInput.inputEl.parentElement.removeChild(
                textInput.inputEl.parentElement.querySelector(
                    ".invalid-feedback"
                )
            );
        }
    }
}

export class FileProjectModal extends ProjectModal<WSFileProject> {
    text: TextComponent = null;
    textValue: string = null;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: WSFileProject) {
        super(app, plugin, manager, project);
    }

    updateIndex() {
        let file = this.manager.collector.getFileSafer(this.textValue);
        if (file != null && file != undefined) {
            this.project.file = file;
            this.manager.updateProject(this.project);
        } else {
            console.error(`Failed to obtain WSFile(${this.textValue} to update index for project (${this.nameObject.getValue()}))`);
            new Notice("Unable to update project index.");
        }
    }

    createProjectObject(): void {
        let name = this.nameObject.getValue();
        let index = this.textValue;
        let file = this.manager.collector.getFileSafer(name);
        if (file != null || file != undefined) {
            console.error(`Attempted to create new WSFileProject(${name}) using invalid file '${index}' as an index.`);
            return;
        }
        this.project = new WSFileProject(this.manager.collector, name, file);
        this.manager.registerProject(this.project);
        this.manager.updateProject(this.project);
    }

    getProjectName(): string {
        return this.project?.name || null;
    }

    getProjectType(): WSPType {
        return this.project?.type || WSPType.File;
    }

    renameProject(): void {
        this.manager.renameProject(this.project as WSProject, this.nameObject.getValue());
    }

    additionalUI(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName("Index File")
            .setDesc("An index file is a markdown file containing links to files included in the project (e.g., Map or Table of Contents).")
            .addText((text) => {
                this.text = text;
                let files = this.app.vault.getMarkdownFiles();
                if (this.project != null && this.project != undefined) {
                    text.setValue(this.project.index);
                } else {
                    text.setPlaceholder("Index File");
                }
                const modal = new FileSuggestionModal(this.app, text, files);

                modal.onClose = () => {
                    if (!text.inputEl.value) {
                        console.log("Input value is null.");
                        this.textValue = null;
                    } else {
                        this.textValue = text.inputEl.value;
                        if (this.textValue != this.project?.index) {
                            this.changed = true;
                        }
                    }
                };

                text.inputEl.onblur = () => {
                    if (!text.inputEl.value) {
                        return;
                    }
                    this.textValue = text.inputEl.value;
                    if (this.textValue != this.project?.index) {
                        this.changed = true;
                    }
                };
            });
    }
}

export class FolderProjectModal extends ProjectModal<WSFolderProject> {
    text: TextComponent = null;
    textValue: string = null;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: WSFolderProject) {
        super(app, plugin, manager, project);
    }

    updateIndex() {
        this.project.folder = this.textValue;
        this.manager.updateProject(this.project);
    }

    createProjectObject(): void {
        let name = this.nameObject.getValue();
        let index = this.textValue;
        this.project = new WSFolderProject(this.manager.collector, name, index);
        this.manager.registerProject(this.project);
        this.manager.updateProject(this.project);
    }

    getProjectName(): string {
        return this.project?.name || null;
    }

    getProjectType(): WSPType {
        return this.project?.type || WSPType.Folder;
    }

    renameProject(): void {
        this.manager.renameProject(this.project as WSProject, this.nameObject.getValue());
    }

    additionalUI(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName("Folder")
            .setDesc("All markdown files within the chosen folder will be included in the project.")
            .addText((text) => {
                this.text = text;
                let folders = this.app.vault.getAllLoadedFiles().filter((t) => t instanceof TFolder);
                if (this.project != null && this.project != undefined) {
                    text.setValue(this.project.index);
                } else {
                    text.setPlaceholder("Index Folder");
                }
                const modal = new FolderSuggestionModal(this.app, text, [...(folders as TFolder[])]);

                modal.onClose = () => {
                    if (!text.inputEl.value) {
                        this.textValue = null;
                        console.log("Input value is null.");
                    } else {
                        this.textValue = text.inputEl.value;
                        if (this.textValue != this.project?.index) {
                            this.changed = true;
                        }
                    }
                };

                text.inputEl.onblur = () => {
                    if (!text.inputEl.value) {
                        return;
                    }
                    this.textValue = text.inputEl.value;
                    if (this.textValue != this.project?.index) {
                        this.changed = true;
                    }
                };
            });
    }
}

export class TagProjectModal extends ProjectModal<WSTagProject> {
    text: TextComponent = null;
    textValue: string = null;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: WSTagProject) {
        super(app, plugin, manager, project);
    }

    updateIndex() {
        this.project.tag = this.textValue;
        this.manager.updateProject(this.project);
    }

    createProjectObject(): void {
        let name = this.nameObject.getValue();
        let index = this.textValue;
        this.project = new WSTagProject(this.manager.collector, name, index);
        this.manager.registerProject(this.project);
        this.manager.updateProject(this.project);
    }

    getProjectName(): string {
        return this.project?.name || null;
    }

    getProjectType(): WSPType {
        return this.project?.type || WSPType.File;
    }

    renameProject(): void {
        this.manager.renameProject(this.project as WSProject, this.nameObject.getValue());
    }

    additionalUI(containerEl: HTMLElement): void {
        new Setting(containerEl)
            .setName("Index File")
            .setDesc("An index file is a markdown file containing links to files included in the project (e.g., Map or Table of Contents).")
            .addText((text) => {
                this.text = text;
                let tags = this.manager.collector.getAllTags();
                if (this.project != null && this.project != undefined) {
                    text.setValue(this.project.index);
                } else {
                    text.setPlaceholder("Index Tag");
                }
                const modal = new TagSuggestionModal(this.app, text, tags);

                modal.onClose = () => {
                    if (!text.inputEl.value) {
                        this.textValue = null;
                        console.log("Input value is null.");
                    } else {
                        this.textValue = text.inputEl.value;
                        if (this.textValue != this.project?.index) {
                            this.changed = true;
                        }
                    }
                };

                text.inputEl.onblur = () => {
                    if (!text.inputEl.value) {
                        return;
                    }
                    this.textValue = text.inputEl.value;
                    if (this.textValue != this.project?.index) {
                        this.changed = true;
                    }
                };
            });
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
        this.project.files.forEach((file) => {
            let row = this.table.createEl("tr");
            let fName = row.createEl("td", { cls: "file-name", text: file.title });
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
                            modal = new FileProjectModal(this.app, this.plugin, this.manager, project as WSFileProject);
                            break;
                        case WSPType.Folder:
                            modal = new FolderProjectModal(this.app, this.plugin, this.manager, project as WSFolderProject);
                            break;
                        case WSPType.Tag:
                            modal = new TagProjectModal(this.app, this.plugin, this.manager, project as WSTagProject);
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

function SetupButtonClickCallback(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, button: ButtonComponent, pType: WSPType) {
    button.onClick(() => {
        let modal: FileProjectModal | FolderProjectModal | TagProjectModal;
        switch (pType) {
            case WSPType.File:
                modal = new FileProjectModal(app, plugin, manager);
                break;
            case WSPType.Folder:
                modal = new FolderProjectModal(app, plugin, manager);
                break;
            case WSPType.Tag:
                modal = new TagProjectModal(app, plugin, manager);
                break;
        }
        if (modal === undefined || modal === null) {
            console.error(`Failed to create modal for new ${pType}/${PROJECT_TYPE_STRING[pType]}`);
            return;
        }
        modal.onClose = () => {
            if (modal.cancelled) {
                return;
            }
            manager.triggerProjectUpdate(modal.project);
            //manager.updateProject(modal.project);
        };
        modal.open();
    });
}

export class ProjectManagerPanel {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLDivElement;
    fileProjects: ProjectList;
    folderProjects: ProjectList;
    tagProjects: ProjectList;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.container = parent.createDiv();
        this.fileProjects = null;
        this.folderProjects = null;
        this.tagProjects = null;
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-update", this.rebuild.bind(this)));
        this.rebuild();
    }

    clear() {
        // cleanup?
    }

    rebuild(project?: WSProject) {
        this.container.empty();
        new Setting(this.container)
            .setName("File Index Projects")
            .setDesc("Create a new project based on a file index.")
            .addButton((button) => {
                button.setButtonText("New File Index Project");
                SetupButtonClickCallback(this.app, this.plugin, this.manager, button, WSPType.File);
            });
        this.fileProjects = new ProjectList(this.app, this.plugin, this.manager, this.container, WSPType.File);
        new Setting(this.container)
            .setName("Folder Projects")
            .setDesc("Create a new project based on a folder.")
            .addButton((button) => {
                button.setButtonText("New Folder Project");
                SetupButtonClickCallback(this.app, this.plugin, this.manager, button, WSPType.Folder);
            });
        this.folderProjects = new ProjectList(this.app, this.plugin, this.manager, this.container, WSPType.Folder);
        new Setting(this.container)
            .setName("Tag Projects")
            .setDesc("Create a new project based on a tag.")
            .addButton((button) => {
                button.setButtonText("New Tag Project");
                SetupButtonClickCallback(this.app, this.plugin, this.manager, button, WSPType.Tag);
            });
        this.tagProjects = new ProjectList(this.app, this.plugin, this.manager, this.container, WSPType.Tag);
    }
}

export class ProjectViewerPanel {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLDivElement;
    list: Map<WSProject, ProjectElement>;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.container = parent.createDiv();
        this.list = new Map<WSProject, ProjectElement>();
        this.rebuild();
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-update", this.onProjectUpdate.bind(this)));
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-files-update", this.onProjectUpdate.bind(this)));
    }

    clear() {
        // cleanup?
    }

    onProjectUpdate(project: WSProject) {
        if (this.list.has(project)) {
            this.list.get(project).update();
        }
    }

    rebuild() {
        this.container.empty();
        this.list.clear();
        this.manager.getProjectList().forEach((project) => {
            this.list.set(project, new ProjectElement(this.app, this.plugin, this.manager, this.container, project));
        });
    }

}

abstract class BaseModal<T> extends Modal {
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    panel: T;
    bmTitle: string;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager) {
        super(app);
        this.plugin = plugin;
        this.manager = manager;
        this.onClose = () => {
            this.clearPanel();
        };
    }

    clear() {
        this.plugin = null;
        this.manager = null;

        let { contentEl } = this;
        contentEl.empty();
    }

    abstract createPanel(): void;
    abstract clearPanel(): void;

    onOpen() {
        let { contentEl } = this;

        contentEl.createEl('h2', { text: this.bmTitle });
        this.createPanel();
    }
}

export class ProjectManagerModal extends BaseModal<ProjectManagerPanel> {
    override bmTitle: string = "Project Manager";

    createPanel(): void {
        let { contentEl } = this;
        this.panel = new ProjectManagerPanel(this.app, this.plugin, this.manager, contentEl);
    }

    clearPanel(): void {
        this.panel.clear();
    }
}

export class ProjectViewerModal extends BaseModal<ProjectViewerPanel> {
    override bmTitle: string = "Project Viewer";

    createPanel(): void {
        let { contentEl } = this;
        this.panel = new ProjectViewerPanel(this.app, this.plugin, this.manager, contentEl);
    }

    clearPanel(): void {
        this.panel.clear();
    }

}