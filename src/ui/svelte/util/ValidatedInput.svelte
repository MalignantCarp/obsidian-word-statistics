<script lang="ts">
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	export let placeholder: string;
	export let validate: (text: string) => [boolean, string];

	let inputText: string = "";
	let icon: HTMLElement;

	$: [isValid, validationMessage] = validate(inputText);

	$: {
		if (icon) {
			icon.empty();
			setIcon(icon, isValid ? "checkmark" : "alert-circle", 16);
		}
	}

	onMount(() => {
		setIcon(icon, isValid ? "checkmark" : "alert-circle", 16);
	});

	export function getText(): string {
		return inputText;
	}

	export function setText(text: string) {
		inputText = text;
	}

	export function isValidated(): boolean {
		return isValid;
	}
</script>

<div class="setting-item-control ws-text-validated">
	<div class="ws-text-validator">
		<i class="ws-text-icon" bind:this={icon} class:error={!isValid} />
		<input class="ws-text" type="text" class:invalid={!isValid} bind:value={inputText} spellcheck="false" {placeholder} />
	</div>
	<div class="ws-text-validated ws-validation-error">
		<div>{validationMessage}</div>
	</div>
</div>
