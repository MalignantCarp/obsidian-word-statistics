<script lang="ts">
	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import { WSCountHistory, type IWordCount } from "src/model/statistics";
import { FormatNumber, FormatWords, RightWordForNumber, SecondsToHMS } from 'src/util';
	import { onDestroy, onMount } from "svelte";

	export let collector: WSDataCollector;
	let focus: WSFile;
	let statObj: WSCountHistory;
	let registered: boolean = false;
	let currentStat: IWordCount;

	onMount(() => {
		collector.plugin.events.on(WSEvents.Focus.File, onFileFocus, { filter: null });
		RegisterWCEvents();
	});

	onDestroy(() => {
		if (registered) {
			collector.plugin.events.off(WSEvents.File.WordsChanged, onWordCountChange, { filter: focus });
		}
		collector.plugin.events.off(WSEvents.Focus.File, onFileFocus, { filter: null });
	});

	function RegisterWCEvents() {
		if (focus instanceof WSFile) {
			collector.plugin.events.on(WSEvents.File.WordsChanged, onWordCountChange, { filter: focus });
			registered = true;
		}
	}

	function UnregisterWCEvents() {
		if (focus instanceof WSFile) {
			collector.plugin.events.off(WSEvents.File.WordsChanged, onWordCountChange, { filter: focus });
			registered = false;
		}
	}

	function onWordCountChange(evt: WSFileEvent) {
		if (registered) {
			statObj = collector.stats.getHistoryItem(focus);
			currentStat = statObj.current;
		}
	}

	function onFileFocus(evt: WSFocusEvent) {
		UnregisterWCEvents();
		focus = evt.info.file;
		RegisterWCEvents();
	}
</script>

<div class="ws-stat-view">
	{#if focus instanceof WSFile && statObj instanceof WSCountHistory}
    <div class="ws-sv-stat-obj">
        <p>Word statistics for {focus.path}</p>
        <div class="ws-sv-stats">
            <div>Air:</div><div>{FormatNumber(currentStat.air) + RightWordForNumber(currentStat.air, "second", "seconds")}</div>
            <div>Start Time:</div><div>{new Date(currentStat.startTime).toLocaleString()}</div>
            <div>End Time:</div><div>{new Date(currentStat.endTime).toLocaleString()}</div>
            <div>Length:</div><div>{FormatNumber(currentStat.length) + RightWordForNumber(currentStat.length, "second", "seconds")}</div>
            <div>Start Words:</div><div>{FormatWords(currentStat.startWords)}</div>
            <div>End Words:</div><div>{FormatWords(currentStat.endWords)}</div>
            <div>Words Added:</div><div>{FormatWords(currentStat.wordsAdded)}</div>
            <div>Words Deleted:</div><div>{FormatWords(currentStat.wordsDeleted)}</div>
            <div>Last Word At:</div><div>{new Date(currentStat.lastWordAt).toLocaleString()}</div>
            <div>Writing Time:</div><div>{SecondsToHMS(currentStat.writingTime)}</div>
        </div>
    </div>
    {:else}
		<p>No file focused.</p>
	{/if}
</div>
