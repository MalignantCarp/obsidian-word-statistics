<script lang="ts">
	import { setIcon } from "obsidian";
	import { Dispatcher, WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import { onDestroy, onMount } from "svelte";

	export let events: Dispatcher;

	let file: WSFile = null;
	let wordCount: string = "";
	let monitoring: boolean = false;
	let errMessage: string = "No file loaded.";
	let containerEl: HTMLElement;

	onMount(() => {
		registerEvents();
		events.on(WSEvents.Focus.File, updateFile, { filter: null });
		setIcon(containerEl, "document", 16);
	});

	onDestroy(() => {
		unregisterEvents();
		events.off(WSEvents.Focus.File, updateFile, { filter: null });
	});

	function updateFile(event: WSFocusEvent) {
		unregisterEvents();
		file = event.info.file;
		registerEvents();
		updateCount();
	}

	export function getWatchFile() {
		return file;
	}

	function registerEvents() {
		if (!monitoring && file instanceof WSFile) {
			events.on(WSEvents.File.WordsChanged, updateCount, { filter: file });
			monitoring = true;
		}
	}

	function unregisterEvents() {
		if (monitoring) {
			events.off(WSEvents.File.WordsChanged, updateCount, { filter: file });
			monitoring = false;
			wordCount = "";
			file = null;
		}
	}

	function updateCount(event?: WSFileEvent) {
		if (file instanceof WSFile) {
			let words = event?.info.words | file.totalWords;
			wordCount = Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
		}
	}
</script>

<div class="ws-sb-counter-file">
	<div class="ws-sb-icon" bind:this={containerEl} class:hidden={!(monitoring && wordCount.length > 0)}/>
	{#if monitoring && wordCount.length > 0}
		<div class="ws-sb-count-file">{wordCount}</div>
	{:else if !monitoring}
		{errMessage}
	{/if}
</div>
