import { Modal, Setting } from "obsidian";
import type WordStatisticsPlugin from "src/main";
import type { WSProjectManager } from "src/model/manager";
import type { WSPath } from "src/model/path";
import type { WSProject } from "src/model/project";
import MessagePanel from "./svelte/Modals/MessagePanel.svelte";
import PathEditor from "./svelte/Modals/PathEditor.svelte";
import ProjectEditor from "./svelte/Modals/ProjectEditor.svelte";

class MessageModal extends Modal {
    panel: MessagePanel;

    constructor(public plugin: WordStatisticsPlugin, public messages: string[]) {
        super(plugin.app);
    }

    onOpen() {
        let {contentEl} = this;
        this.panel = new MessagePanel({ target: contentEl, props: { messages: this.messages } });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }

}

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


class ProjectEditorModal extends Modal {
    manager: WSProjectManager;
    panel: ProjectEditor;

    constructor(public plugin: WordStatisticsPlugin, public project?: WSProject) {
        super(plugin.app);
        this.manager = plugin.collector.manager;
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new ProjectEditor({ target: contentEl, props: { manager: this.manager, onClose: this.close.bind(this), _project: this.project } });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}

class PathEditorModal extends Modal {
    manager: WSProjectManager;
    panel: PathEditor;

    constructor(public plugin: WordStatisticsPlugin, public path?: WSPath) {
        super(plugin.app);
        this.manager = plugin.collector.manager;
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new PathEditor({ target: contentEl, props: { manager: this.manager, onClose: this.close.bind(this), path: this.path } });
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

    createProjectEditorModal(project?: WSProject) {
        return new ProjectEditorModal(this.plugin, project);
    }

    createConfirmationModal(message: string, cb: Function) {
        return new ConfirmationModal(this.plugin, message, cb);
    }

    createMessageModal(messages: string[]) {
        return new MessageModal(this.plugin, messages);
    }

    createPathEditorModal(path: WSPath) {
        return new PathEditorModal(this.plugin, path);
    }

}