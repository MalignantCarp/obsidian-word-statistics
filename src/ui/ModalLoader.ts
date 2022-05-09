import { ButtonComponent, Modal, Setting } from "obsidian";
import type WordStatisticsPlugin from "src/main";
import type { WSProjectManager } from "src/model/manager";
import { WSProject, WSPType } from "src/model/project";
import ProjectEditor from "./svelte/ProjectManagerModal/ProjectEditor.svelte";
import ProjectManager from "./svelte/ProjectManagerModal/ProjectManager.svelte";

class ConfirmationModal extends Modal {
    confirmation: boolean = false;

    constructor(public plugin: WordStatisticsPlugin, public message: string, public cb: Function) {
        super(plugin.app);
    }

    onDelete(event?: MouseEvent) {
        this.confirmation = true;
        this.close();
    }

    onCancel(event?: MouseEvent) {
        this.confirmation = false;
        this.close();
    }

    onOpen() {
        let { contentEl } = this;
        new Setting(contentEl)
            .setName("Deletion Confirmation")
            .setDesc(this.message);
        new Setting(contentEl).addButton((button) => {
            button.setButtonText("Delete");
            button.onClick(this.onDelete.bind(this));
        })
            .addButton((button) => {
                button.setButtonText("Cancel");
                button.onClick(this.onCancel.bind(this));
            });
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
        this.cb();
    }
}


// =======================
//  Project Manager Modal
// =======================

class ProjectManagerModal extends Modal {
    manager: WSProjectManager;
    panel: ProjectManager;

    constructor(public plugin: WordStatisticsPlugin) {
        super(plugin.app);
        this.manager = plugin.collector.manager;
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new ProjectManager({ target: contentEl, props: { manager: this.manager } });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}

// =======================
//  Project Editor Modals
// =======================

class FileProjectModal extends Modal {
    manager: WSProjectManager;
    panel: ProjectEditor;

    constructor(public plugin: WordStatisticsPlugin, public project?: WSProject) {
        super(plugin.app);
        this.manager = plugin.collector.manager;
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new ProjectEditor({ target: contentEl, props: { manager: this.manager, type: WSPType.File, onClose: this.close.bind(this), _project: this.project } });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}

class FolderProjectModal extends Modal {
    manager: WSProjectManager;
    panel: ProjectEditor;

    constructor(public plugin: WordStatisticsPlugin, public project?: WSProject) {
        super(plugin.app);
        this.manager = plugin.collector.manager;
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new ProjectEditor({ target: contentEl, props: { manager: this.manager, type: WSPType.Folder, onClose: this.close.bind(this), _project: this.project } });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}

class TagProjectModal extends Modal {
    manager: WSProjectManager;
    panel: ProjectEditor;

    constructor(public plugin: WordStatisticsPlugin, public project?: WSProject) {
        super(plugin.app);
        this.manager = plugin.collector.manager;
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new ProjectEditor({ target: contentEl, props: { manager: this.manager, type: WSPType.Tag, onClose: this.close.bind(this), _project: this.project } });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}

export class ModalLoader {
    constructor(public plugin: WordStatisticsPlugin, public manager: WSProjectManager) { }

    createProjectManagerModal() {
        return new ProjectManagerModal(this.plugin);
    }

    createFileProjectModal(project?: WSProject) {
        return new FileProjectModal(this.plugin, project);
    }

    createFolderProjectModal(project?: WSProject) {
        return new FolderProjectModal(this.plugin, project);
    }

    createTagProjectModal(project?: WSProject) {
        return new TagProjectModal(this.plugin, project);
    }

    createModalFromType(type: WSPType) {
        if (type === WSPType.File) {
            return this.createFileProjectModal();
        } else if (type === WSPType.Folder) {
            return this.createFolderProjectModal();
        } else if (type === WSPType.Tag) {
            return this.createTagProjectModal();
        }
    }

    createModalFromProject(project: WSProject) {
        if (project.type === WSPType.File) {
            return this.createFileProjectModal(project);
        } else if (project.type === WSPType.Folder) {
            return this.createFolderProjectModal(project);
        } else if (project.type === WSPType.Tag) {
            return this.createTagProjectModal(project);
        }
    }

    createConfirmationModal(message: string, cb: Function) {
        return new ConfirmationModal(this.plugin, message, cb);
    }

}