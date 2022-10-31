import { Modal, Setting } from 'obsidian';
import type WordStatisticsPlugin from 'src/main';
import type { WSFolder } from 'src/model/folder';
import GoalChooser from '../svelte/GoalChooser.svelte';

export class GoalModal extends Modal {
    public panel: GoalChooser;

    constructor(public plugin: WordStatisticsPlugin, public folder: WSFolder) {
        super(plugin.app);
    }

    onSave(event?: MouseEvent) {
        this.plugin.manager.updateGoals(this.folder, ...this.panel.getWordGoals());
        this.close();
    }

    onCancel(event?: MouseEvent) {
        this.close();
    }

    onOpen() {
        let { contentEl } = this;
        this.panel = new GoalChooser({target: contentEl, props: {folder: this.folder}});
        new Setting(contentEl)
            .addButton((button) => {
                button.setButtonText("Save");
                button.onClick(this.onSave.bind(this));
            })
            .addButton((button) => {
                button.setButtonText("Cancel");
                button.onClick(this.onCancel.bind(this));
            });
    }

    onClose() {
        if (this.panel) {
            this.panel.$destroy();
        }
        let { contentEl } = this;
        contentEl.empty();
    }
}