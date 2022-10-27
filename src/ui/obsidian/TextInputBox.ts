import { Modal, Setting, TextComponent } from 'obsidian';
import type WordStatisticsPlugin from 'src/main';

export class TextInputBox extends Modal {
    confirmation: boolean = false;
    entry: TextComponent;

    constructor(public plugin: WordStatisticsPlugin, public name: string, public message: string, public loadHandler: Function, public saveHandler: Function, public label: string = "Save") {
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
            .setDesc(this.message)
            .addText((text) => {
                this.entry = text;
                text.setValue(this.loadHandler());
            });
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
        this.saveHandler(this.entry.getValue());
        contentEl.empty();
    }
}