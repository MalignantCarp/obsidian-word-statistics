<script lang="ts">
	import { setIcon } from "obsidian";
	import { Dispatcher, WSEvents, WSFileEvent } from "src/event";
	import { WSDataCollector } from "src/model/collector";
	import { onDestroy, onMount } from "svelte";

	export let events: Dispatcher;
	export let collector: WSDataCollector;

	let wordCount: string = "";
	let monitoring: boolean = false;
	let containerEl: HTMLElement;

	onMount(() => {
		registerEvents();
		setIcon(containerEl, "vault", 16);
	});

	onDestroy(() => {
		unregisterEvents();
	});

	function registerEvents() {
		if (!monitoring && collector instanceof WSDataCollector) {
			events.on(WSEvents.File.WordsChanged, updateCount, { filter: null });
			monitoring = true;
			updateCount(null);
		}
	}

	function unregisterEvents() {
		if (monitoring) {
			events.off(WSEvents.File.WordsChanged, updateCount, { filter: null });
			monitoring = false;
			wordCount = "";
		}
	}

	function updateCount(event: WSFileEvent) {
		let words = collector.totalWords;
		wordCount = Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
	}
</script>

<div class="ws-sb-counter-vault">
	<div class="ws-sb-icon" bind:this={containerEl} class:hidden={!(monitoring && wordCount.length > 0)} />
	{#if monitoring && wordCount.length > 0}
		<div class="ws-sb-count-vault">{wordCount}</div>
	{/if}
</div>
