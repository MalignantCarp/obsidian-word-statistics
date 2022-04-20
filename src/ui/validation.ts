import { TextComponent } from "obsidian";
import { WSPErrors } from "src/errors";

export function Validate(v: string, errors: Map<string, boolean>, text: TextComponent, checkName: Function, getName: Function) {
    if (!checkName(v) && (getName() != v)) {
        errors.set(WSPErrors.PROJECT_NAME_INVALID, true);
        SetValidationError(text, WSPErrors.MESSAGE.PROJECT_NAME_INVALID);
        return;
    } else {
        errors.set(WSPErrors.PROJECT_NAME_INVALID, false);
        RemoveValidationError(text);
    }
    if (!v.length) {
        errors.set(WSPErrors.PROJECT_NAME_BLANK, true);
        SetValidationError(text, WSPErrors.MESSAGE.PROJECT_NAME_BLANK);
        return;
    } else {
        errors.set(WSPErrors.PROJECT_NAME_BLANK, false);
        RemoveValidationError(text);
    }
}

/*
Set and Remove ValidationError functions borrowed from Admonitions plugin by Jeremy Valentine
used under MIT License (see LICENSE).
https://github.com/valentine195/obsidian-admonition
src/settings.ts retrieved April 14, 2022.

modified for custom CSS
*/


export function SetValidationError(textInput: TextComponent, message?: string) {
    textInput.inputEl.addClass("ws-is-invalid");
    if (message) {
        textInput.inputEl.parentElement.addClasses([
            "ws-has-invalid-message",
            "ws-unset-align-items"
        ]);
        textInput.inputEl.parentElement.parentElement.addClass(".ws-unset-align-items");
        let mDiv = textInput.inputEl.parentElement.querySelector(".ws-invalid-feedback") as HTMLDivElement;
        if (!mDiv) {
            mDiv = createDiv({ cls: "ws-invalid-feedback" });
        }
        mDiv.innerText = message;
        mDiv.insertAfter(textInput.inputEl);
    }
}

export function RemoveValidationError(textInput: TextComponent) {
    textInput.inputEl.removeClass("ws-is-invalid");
    textInput.inputEl.parentElement.removeClasses([
        "ws-has-invalid-message",
        "ws-unset-align-items"
    ]);
    textInput.inputEl.parentElement.parentElement.removeClass(".ws-unset-align-items");

    if (textInput.inputEl.parentElement.querySelector(".ws-invalid-feedback")) {
        textInput.inputEl.parentElement.removeChild(
            textInput.inputEl.parentElement.querySelector(
                ".ws-invalid-feedback"
            )
        );
    }
}
