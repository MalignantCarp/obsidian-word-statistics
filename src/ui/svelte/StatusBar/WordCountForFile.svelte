<script lang="ts">
	import { setIcon } from "obsidian";
	import { Dispatcher, WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import { onDestroy, onMount } from "svelte";

	export let events: Dispatcher;

	export let file: WSFile = null;
	let wordCount: string = "";
	let containerEl: HTMLElement;

	onMount(() => {
		registerEvents();
		events.on(WSEvents.Focus.File, updateFile, { filter: null });
		setIcon(containerEl, "document", 16);
		updateCount();
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
		events.on(WSEvents.File.WordsChanged, updateCount, { filter: file });
	}

	function unregisterEvents() {
		events.off(WSEvents.File.WordsChanged, updateCount, { filter: file });
	}

	function updateCount(event?: WSFileEvent) {
		if (file instanceof WSFile) {
			let words = event?.info.words | file.totalWords;
			wordCount = Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
		}
	}
</script>

<div class="ws-sb-counter-file">
	<div class="ws-sb-icon" bind:this={containerEl} />
	<div class="ws-sb-count-file">{wordCount}</div>
</div>
