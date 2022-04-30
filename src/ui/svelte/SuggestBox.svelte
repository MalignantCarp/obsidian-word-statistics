<script lang="ts">
	import { createPopperActions } from "svelte-popperjs";

	export let placeholder: string;
	export let options: string[];

	let searchString = "";
	let filteredOptions: string[] = [];

	let highlightIndex: number = null;
	let inputComponent: HTMLInputElement;

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
		return text.replace(new RegExp("^" + searchString), "<span class='suggestion-highlight'>" + searchString + "</span>");
	}

	function clearSearchHighlight(text: string): string {
		return text.replace(/\<\/?span.*?\>/g, "");
	}

	function filterOptions() {
		let filtered: string[] = [];
		if (searchString) {
			options.forEach(option => {
				if (option.toLowerCase().startsWith(searchString.toLowerCase())) {
					filtered.push(searchHighlight(option));
				}
			});
		}
		filteredOptions = filtered;
	}

	function setInputValue(text: string) {
		searchString = clearSearchHighlight(text);
		highlightIndex = null;
		inputComponent.focus();
	}

	function onKeyNav(event: KeyboardEvent) {
		let list: string[] = options;
		if (filteredOptions.length > 0) {
			list = filteredOptions;
		}
		if (event.key == "ArrowDown" && highlightIndex <= list.length - 1) {
			highlightIndex === null ? (highlightIndex = 0) : (highlightIndex += 1);
		} else if (event.key == "ArrowUp" && highlightIndex != null) {
			highlightIndex > 0 ? (highlightIndex -= 1) : (highlightIndex = 0);
		} else if (event.key == "Enter") {
			setInputValue(list[highlightIndex]);
		}
	}

	$: if (!searchString) {
		filteredOptions = [];
		highlightIndex = null;
	}
</script>

<svelte:window on:keydown={onKeyNav} />
<div class="setting-item-control">
	<input type="text" bind:this={inputComponent} bind:value={searchString} spellcheck="false" {placeholder} use:popperRef on:input={filterOptions} />
</div>
<div class="suggestion-container" use:popperContent={extraOpts}>
	<div class="suggestion">
		{#if filteredOptions}
			{#each filteredOptions as option}
				<div class="suggestion-item">{option}</div>
			{/each}
		{:else}
			{#each options as option, i}
				<div class="suggestion-item" class:is-selected={highlightIndex === i}>{option}</div>
			{/each}
		{/if}
	</div>
</div>
