/*

Borrowed from Jeremy Valentine's Fantasy Calendar plugin as path.ts,
https://github.com/fantasycalendar/obsidian-fantasy-calendar
Retrieved April 14, 2022

Adapted by Ryan Fitzgerald to only deal with TFiles and not deal with headings and blocks.

*/

import { SuggestionModal } from "./suggester";
import {
    FuzzyMatch,
    TFile,
    CachedMetadata,
    TextComponent,
    App,
} from "obsidian";

export default class FileSuggestionModal extends SuggestionModal<TFile> {
    file: TFile;
    files: TFile[];
    text: TextComponent;
    cache: CachedMetadata;
    constructor(app: App, input: TextComponent, items: TFile[]) {
        super(app, input.inputEl, items);
        this.files = [...items];
        this.text = input;

        this.inputEl.addEventListener("input", this.getFile.bind(this));
    }
    getFile() {
        const v = this.inputEl.value,
            file = this.app.metadataCache.getFirstLinkpathDest(
                v.split(/[\^#]/).shift() || "",
                ""
            );
        if (file == this.file) return;
        if (!(file instanceof TFile)) return;
        this.file = file;
        if (this.file)
            this.cache = this.app.metadataCache.getFileCache(this.file);
        this.onInputChanged();
    }
    getItemText(item: TFile) {
        return item.path;
    }
    onChooseItem(item: TFile) {
        this.text.setValue(item.basename);
        this.file = item;
        this.cache = this.app.metadataCache.getFileCache(this.file);
    }
    link: string;
    selectSuggestion({ item }: FuzzyMatch<TFile>) {
        let link: string;
        this.file = item;
        link = item.basename;
        const path = this.file.path.split("/").slice(0, -1);
        if (path.length) {
            this.link = path.join("/") + "/" + link;
        } else {
            this.link = link;
        }
        this.text.setValue(link);

        this.close();
        this.onClose();
    }
    renderSuggestion(result: FuzzyMatch<TFile>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content"
        });
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        let pathLength = item.path.length - item.name.length;
        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = pathLength; i < item.path.length - item.extension.length - 1; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.path.substring(match[0], match[1]));
                i += match[1] - match[0] - 1;
                continue;
            }
            content.appendText(item.path[i]);
        }
        el.createDiv({
            cls: "suggestion-note",
            text: item.path
        });
    }

    getItems() {
        return this.files;
    }
}