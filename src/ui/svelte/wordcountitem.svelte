<script lang="ts">
	import { Dispatcher, WSEvents, WSFileEvent } from "src/event";
	import type { WSDataCollector } from "src/model/collector";
	import { WSFile } from "src/model/file";
	import { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";

	export let counter: WSFile | WSProject;
	export let collector: WSDataCollector;
	export let eventDispatcher: Dispatcher;
	export let showTotal: boolean = false;

	let wordCount: string;
	let monitoring: boolean = false;

	onMount(() => {
		registerEvents();
	});

	onDestroy(() => {
		unregisterEvents();
	});

	function registerEvents() {
		if (!monitoring && counter != null && counter != undefined) {
			if (showTotal || counter instanceof WSProject) {
				eventDispatcher.on(WSEvents.File.WordsChanged, updateCount);
			}
			if (counter instanceof WSFile) {
				eventDispatcher.on(WSEvents.File.WordsChanged, updateCount, { filter: counter });
			}
			monitoring = true;
		}
	}

	function unregisterEvents() {
		eventDispatcher.off(WSEvents.File.WordsChanged, updateCount);
		eventDispatcher.off(WSEvents.File.WordsChanged, updateCount, { filter: counter });
	}

	function updateCount(event: WSFileEvent) {
		if (showTotal) {
			let words = counter.totalWords;
			let totalWords = collector.totalWords;
			wordCount = Intl.NumberFormat().format(words) + " / " + Intl.NumberFormat().format(totalWords) + " " + (words == 1 ? "word" : "words");
		} else {
			let words = counter.totalWords;
			wordCount = Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
		}
	}

	export function changeCounter(newCounter: WSFile | WSProject, total?: boolean) {
		if (monitoring) {
			unregisterEvents();
			monitoring = false;
		}
		if (total != undefined && total != null) {
			showTotal = total;
		}
		counter = newCounter;
		registerEvents();
        updateCount(null);
	}
</script>

<div class="ws-wordcount">{wordCount}</div>
