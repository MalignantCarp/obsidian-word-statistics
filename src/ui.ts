import { App, Modal, Notice, Setting, TextComponent } from "obsidian";
import WordStatisticsPlugin from "./main";
import { PROJECT_TYPE_NAME, WSFileProject, WSFolderProject, WSProject, WSProjectManager, WSPType, WSTagProject } from "./projects";

export class ProjectModal extends Modal {
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    project: WSProject;
    readonly type: WSPType;
    errors: Map<string, boolean>;
    nameObject: TextComponent;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, pType: WSPType, project?: WSProject) {
        super(app);
        this.plugin = plugin;
        this.manager = manager;
        this.type = pType;
        this.project = project || null;
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

    additionalUI(contentEl: HTMLElement) {
        // this will be overridden based on the type of project being created/modified
    }

    createProjectObject(name: string, pType: WSPType, index: string) {
        let proj: WSProject;

        switch (pType) {
            case WSPType.File:
                let file = this.manager.collector.getFileSafer(index);
                if (file === null || file === undefined) {
                    console.log(name, index, pType);
                    this.manager.logError(`ProjectModal() unable to retrieve WSFile for '${index}'`);
                    throw Error();
                }
                proj = <WSProject>new WSFileProject(this.manager.collector, name, file);
                break;
            case WSPType.Folder:
                proj = <WSProject>new WSFolderProject(this.manager.collector, name, index);
                break;
            case WSPType.Tag:
                proj = <WSProject>new WSTagProject(this.manager.collector, name, index);
                break;
            default:
                console.log(name, index, pType);
                this.manager.logError(`ProjectModal() given invalid type '${pType}'`);
                break;
        }
    }

    onOpen() {
        let { contentEl } = this;
        if (this.project != null) {
            contentEl.createEl('h2', { text: `Modify ${PROJECT_TYPE_NAME[this.project.type]}` });
        } else {
            contentEl.createEl('h2', { text: `Create ${PROJECT_TYPE_NAME[this.type]}` });
        }
        new Setting(contentEl)
            .setName('Project Name')
            .setDesc('The name of the project (must be unique)')
            .addText((tc: TextComponent) => {
                this.nameObject = tc;
                if (this.project != null) {
                    this.nameObject.setValue(this.project.name);
                }
                this.nameObject.onChange((v) => {
                    v = v.trim();
                    if (!this.manager.checkProjectName(v) && (this.project?.name != v)) {
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
                    console.log(errors);
                    if (errorState) {
                        new Notice(WSPErrors.MESSAGE.PROJECT_VALIDATION);
                    } else {
                        this.close();
                    }
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


export class FileProjectModal extends ProjectModal {
    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: WSFileProject) {
        super(app, plugin, manager, WSPType.File, project);
    }
}

export class FolderProjectModal extends ProjectModal {
    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: WSFileProject) {
        super(app, plugin, manager, WSPType.Folder, project);
    }
}

export class TagProjectModal extends ProjectModal {
    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, project?: WSFileProject) {
        super(app, plugin, manager, WSPType.Tag, project);
    }
}

export class ProjectManagerPanel {
    parent: HTMLElement;
    fileProjects: Map<string, HTMLElement>;
    folderProjects: Map<string, HTMLElement>;
    tagProjects: Map<string, HTMLElement>;

    constructor(parent: HTMLElement, manager: WSProjectManager) {
        this.parent = parent;
        this.fileProjects = new Map<string, HTMLElement>();
        this.folderProjects = new Map<string, HTMLElement>();
        this.tagProjects = new Map<string, HTMLElement>();
    }
}