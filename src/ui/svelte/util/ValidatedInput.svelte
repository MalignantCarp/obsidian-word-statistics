<script lang="ts">
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	export let placeholder: string;
	export let validate: (text: string) => [boolean, string];

	let inputText: string;
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

	export function isValidated(): boolean {
		return isValid;
	}
</script>

<div class="setting-item-control ws-text-validated">
	<i class="ws-text-icon" bind:this={icon} class:error={!isValid} />
	<input type="text" class:invalid={isValid} bind:value={inputText} spellcheck="false" {placeholder} />
	<div class="ws-validation-messages">
        <div>{validationMessage}</div>
	</div>
</div>
