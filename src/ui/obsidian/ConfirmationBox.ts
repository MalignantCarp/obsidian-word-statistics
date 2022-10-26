import { Modal, Setting } from 'obsidian';
import type WordStatisticsPlugin from 'src/main';

export class ConfirmationModal extends Modal {
    confirmation: boolean = false;

    constructor(public plugin: WordStatisticsPlugin, public name: string, public message: string, public handler: Function, public label: string = "Continue") {
        super(plugin.app);
    }

    onContinue(event?: MouseEvent) {
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
            .setName(this.name)
            .setDesc(this.message);
        new Setting(contentEl).addButton((button) => {
            button.setButtonText(this.label);
            button.onClick(this.onContinue.bind(this));
        })
            .addButton((button) => {
                button.setButtonText("Cancel");
                button.onClick(this.onCancel.bind(this));
            });
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
        this.handler();
    }
}