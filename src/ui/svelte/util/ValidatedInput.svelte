<script lang="ts">
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";

	export let placeholder: string;
	export let validate: (text: string) => [boolean, string];

	let inputText: string = "";
	let icon: HTMLElement;
	export let isValid: boolean;
	let validationMessage: string;

	$: [isValid, validationMessage] = validate(inputText);

	$: {
		if (icon) {
			icon.empty();
			setIcon(icon, isValid ? "check-small" : "alert-circle", 16);
		}
	}

	onMount(() => {
		setIcon(icon, isValid ? "check-small" : "alert-circle", 16);
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

<div class="setting-item-control ws-validated-input">
	<div class="ws-validated-input-container">
		<i class="ws-text-icon" bind:this={icon} class:error={!isValid} />
		<input class="ws-input" type="text" class:invalid={!isValid} bind:value={inputText} spellcheck="false" {placeholder} />
		<div class="ws-validation-error">
			<div class="ws-validation-message" class:hidden={isValid}>{validationMessage}</div>
		</div>
	</div>
</div>
