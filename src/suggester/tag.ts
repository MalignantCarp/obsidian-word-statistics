/*

Adapted from Jeremy Valentine's Fantasy Calendar plugin suggester/folder.ts to handle tags.
https://github.com/fantasycalendar/obsidian-fantasy-calendar
Retrieved April 14, 2022

*/

import {
    TextComponent,
    CachedMetadata,
    App,
    FuzzyMatch,
    getAllTags
} from "obsidian";
import { SuggestionModal } from "./suggester";

export class TagSuggestionModal extends SuggestionModal<string> {
    text: TextComponent;
    cache: CachedMetadata;
    tags: string[];
    tag: string;
    constructor(app: App, input: TextComponent, items: string[]) {
        super(app, input.inputEl, items);
        this.tags = [...items];
        this.text = input;

        this.inputEl.addEventListener("input", () => this.getTag());
    }
    getTag() {
        const v = this.inputEl.value;
        let valid = this.tags.contains(v);
        if (v == this.tag) return;
        if (!valid) return;
        this.tag = v;

        this.onInputChanged();
    }
    getItemText(item: string) {
        return item;
    }
    onChooseItem(item: string) {
        this.text.setValue(item);
        this.tag = item;
    }
    selectSuggestion({ item }: FuzzyMatch<string>) {
        let link = item;

        this.text.setValue(link);
        this.onClose();

        this.close();
    }
    renderSuggestion(result: FuzzyMatch<string>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content"
        });
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item[i]);
        }
        el.createDiv({
            cls: "suggestion-note",
            text: item
        });
    }

    getItems() {
        return this.tags;
    }
}