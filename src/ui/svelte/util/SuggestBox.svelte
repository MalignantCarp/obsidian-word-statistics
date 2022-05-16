<script lang="ts">
	import { setIcon } from "obsidian";
	import { onMount } from "svelte";
	import { createPopperActions } from "svelte-popperjs";
	import * as fuzzysort from 'fuzzysort';

	export let placeholder: string;
	export let options: string[];

	let searchString = "";
	let filteredOptions: string[] = [];

	let highlightIndex: number = null;
	let inputComponent: HTMLInputElement;
	let suggestionBox: HTMLElement;

	const [popperRef, popperContent] = createPopperActions({
		placement: "bottom-start"
	});

	const extraOpts = {
		modifiers: [
			{ name: "offset", options: { offset: [0, 8] } },
			{ name: "flip", options: { fallbackPlacements: ["top"] } }
		]
	};

	export function getSelectedOption() {
		return options.contains(searchString) ? searchString : null;
	}

	function searchHighlight(text: string): string {
		return text.replace(new RegExp(searchString), "<span class='suggestion-highlight'>" + searchString + "</span>");
	}

	function clearSearchHighlight(text: string): string {
		return text.replace(/\<\/?span.*?\>/g, "");
	}

	function filterOptions() {
		let filtered: string[] = [];
		if (searchString) {
			let results = fuzzysort.go(searchString, options, {all:true});
			results.forEach((result) => {
				// console.log(result);
				filtered.push(fuzzysort.highlight(result, "<span class='suggestion-highlight'>", "</span>"));
			})
		}
		filteredOptions = filtered;
	}

	function setSuggestion(text: string) {
		searchString = clearSearchHighlight(text);
		highlightIndex = null;
		inputComponent.focus();
		focus = false;
	}

	function onKeyNav(event: KeyboardEvent) {
		if (inputComponent.isShown() && showOptions) {
			let list: string[] = options;
			if (filteredOptions.length > 0) {
				list = filteredOptions;
			}

			if (event.key == "ArrowDown" && (highlightIndex === null || highlightIndex < list.length - 1)) {
				highlightIndex === null ? (highlightIndex = 0) : (highlightIndex += 1);
			} else if (event.key == "ArrowDown" && highlightIndex === list.length - 1) {
				highlightIndex = 0;
			} else if (event.key == "ArrowUp" && highlightIndex != null) {
				highlightIndex > 0 ? (highlightIndex -= 1) : (highlightIndex = list.length - 1);
			} else if (event.key == "Enter" && highlightIndex != null) {
				setSuggestion(list[highlightIndex]);
			}
		}
	}

	$: if (!searchString) {
		filteredOptions = [];
		highlightIndex = null;
	}

	$: showOptions = focus && (searchString.length > 0 ? filteredOptions.length > 0 : options.length > 0);

	$: if (showOptions && suggestionBox) {
		suggestionBox.focus();
	}

	export let isValid: boolean;

	$: isValid = options.contains(searchString);

	let icon: HTMLElement;
	let focus = false;

	export function isValidated() {
		return isValid;
	}

	export function setInitial(text: string) {
		searchString = text;
	}

	function onFocus() {
		focus = true;
	}

	function onBlur() {
		focus = false;
	}

	function onMouseDown(event: MouseEvent) {
		event.preventDefault();
	}

	$: {
		if (icon) {
			icon.empty();
			setIcon(icon, isValid ? "check-small" : "alert-circle", 16);
		}
	}

	onMount(() => {
		setIcon(icon, isValid ? "check-small" : "alert-circle", 16);
	});
</script>

<svelte:window on:keydown={onKeyNav} />
<div class="setting-item-control ws-suggest-box">
	<div class="ws-suggest-box-container">
		<i class="ws-text-icon" bind:this={icon} class:error={!isValid} />
		<input
			class="ws-input"
			type="text"
			class:invalid={!isValid}
			on:focus={onFocus}
			on:input={onFocus}
			on:blur={onBlur}
			bind:this={inputComponent}
			bind:value={searchString}
			spellcheck="false"
			{placeholder}
			use:popperRef
			on:input={filterOptions}
		/>
		<div class="ws-validation-error">
			<div class="ws-validation-message" class:hidden={isValid}>Please select an option from the list.</div>
		</div>
	</div>
</div>
{#if showOptions}
	<div class="suggestion-container ws-suggest-box" on:mousedown={onMouseDown} use:popperContent={extraOpts} bind:this={suggestionBox}>
		<div class="suggestion">
			{#if filteredOptions.length > 0}
				{#each filteredOptions as option, i}
					<div class="suggestion-item" on:click={() => setSuggestion(option)} class:is-selected={highlightIndex === i}>{@html option}</div>
				{/each}
			{:else}
				{#each options as option, i}
					<div class="suggestion-item" on:click={() => setSuggestion(option)} class:is-selected={highlightIndex === i}>{@html option}</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
