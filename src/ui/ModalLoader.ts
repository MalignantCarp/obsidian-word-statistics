import { Modal } from "obsidian";
import type WordStatisticsPlugin from "src/main";
import type { WSProjectManager } from "src/model/manager";
import { WSProject, WSPType } from "src/model/project";
import ProjectEditor from "./svelte/ProjectManager/ProjectEditor.svelte";
import ProjectManager from "./svelte/ProjectManager/ProjectManager.svelte";

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
        this.panel = new ProjectManager({target: contentEl, props: {manager: this.manager}});
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

}