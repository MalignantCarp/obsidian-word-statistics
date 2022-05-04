import { App, Modal, Notice, Setting, TextComponent, TFolder } from "obsidian";
import { WSPErrors } from "src/errors";
import type WordStatisticsPlugin from "src/main";
import { WSFile } from "src/model/file";
import { WSProjectGroup } from "src/model/group";
import type { WSProjectManager } from "src/model/manager";
import { PROJECT_TYPE_NAME, WSFileProject, WSFolderProject, WSProject, WSPType, WSTagProject } from "src/model/project";
import FileSuggestionModal from "src/suggester/file";
import { FolderSuggestionModal } from "src/suggester/folder";
import { TagSuggestionModal } from "src/suggester/tag";
import { ProjectGroupManagerPanel, ProjectGroupViewerPanel, ProjectManagerPanel, ProjectViewerPanel } from "./panels";
import { Validate } from "./validation";

abstract class EditProjectModal<T> extends Modal {
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
                    Validate(v, this.errors, this.nameObject, this.manager.checkProjectName.bind(this.manager), this.getProjectName.bind(this));
                });
                Validate(this.nameObject.getValue(), this.errors, this.nameObject, this.manager.checkProjectName.bind(this.manager), this.getProjectName.bind(this));
            });
        this.additionalUI(contentEl);
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Save").onClick(async () => {
                    let v = this.nameObject.getValue();
                    v = v.trim();
                    Validate(v, this.errors, this.nameObject, this.manager.checkProjectName.bind(this.manager), this.getProjectName.bind(this));
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
}

export class EditFileProjectModal extends EditProjectModal<WSFileProject> {
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
        let file = this.manager.collector.getFileSafer(index);
        console.log(name, index, file);
        if (file instanceof WSFile) {
            this.project = new WSFileProject(this.manager.collector, name, file);
            this.manager.registerProject(this.project);
            this.manager.updateProject(this.project);
            return;
        }
        console.error(`Attempted to create new WSFileProject(${name}) using invalid file '${index}' as an index.`);
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
                        this.textValue = modal.file.path;
                        if (this.textValue != this.project?.index) {
                            this.changed = true;
                        }
                    }
                };

                text.inputEl.onblur = () => {
                    if (!text.inputEl.value) {
                        return;
                    }
                    this.textValue = modal.file.path;
                    if (this.textValue != this.project?.index) {
                        this.changed = true;
                    }
                };
            });
    }
}

export class EditFolderProjectModal extends EditProjectModal<WSFolderProject> {
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

export class EditTagProjectModal extends EditProjectModal<WSTagProject> {
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

export class EditProjectGroupModal extends Modal {
    headContainer: HTMLDivElement;
    container: HTMLDivElement;
    setting: Setting;
    nameObject: TextComponent;
    errors: Map<string, boolean>;
    new: boolean;
    cancelled: false;

    constructor(app: App, private plugin: WordStatisticsPlugin, private manager: WSProjectManager, private group?: WSProjectGroup) {
        super(app);
        this.new = group instanceof WSProjectGroup;
    }

    getProjectGroupName() {
        return this.group?.name;
    }

    renameProjectGroup() {
        this.manager.renameProjectGroup(this.group, this.nameObject.getValue());
    }

    createGroupObject() {
        if (this.group instanceof WSProjectGroup) {
            throw Error("Attempted to create a project group from an existing project group.")
        }
        this.group = new WSProjectGroup(this.nameObject.getValue());
        this.manager.registerProjectGroup(this.group);
    }

    onOpen() {
        let { contentEl } = this;

        contentEl.createEl('h2', { text: this.new ? "New Project Group" : "Edit Project Group" });

        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Save").onClick(async () => {
                    let v = this.nameObject.getValue();
                    v = v.trim();
                    Validate(v, this.errors, this.nameObject, this.manager.checkProjectGroupName.bind(this.manager), this.getProjectGroupName.bind(this));
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
                            this.createGroupObject();
                        } else {
                            if (this.getProjectGroupName() != this.nameObject.getValue()) {
                                this.renameProjectGroup();
                            }
                        }
                        this.close();
                    }
                });
            })
            .addButton((button) => {
                button.setButtonText("Cancel").onClick(() => {
                    this.close();
                });
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
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Close").onClick(() => {
                    this.close();
                });
            });
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

export class ProjectGroupViewerModal extends BaseModal<ProjectGroupViewerPanel> {
    override bmTitle: string = "Project Group Viewer";

    createPanel(): void {
        let { contentEl } = this;
        this.panel = new ProjectGroupViewerPanel(this.app, this.plugin, this.manager, contentEl);
    }

    clearPanel(): void {
        this.panel.clear();
    }
}

export class ProjectGroupManagerModal extends BaseModal<ProjectGroupManagerPanel> {
    override bmTitle: string = "Project Group Manager";

    createPanel(): void {
        let { contentEl } = this;
        this.panel = new ProjectGroupManagerPanel(this.app, this.plugin, this.manager, contentEl);
    }

    clearPanel(): void {
        this.panel.clear();
    }
}