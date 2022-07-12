<script lang="ts">
	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import { WSCountHistory, type IWordCount } from "src/model/statistics";
	import { FormatNumber, FormatWords, RightWordForNumber, SecondsToHMS } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let collector: WSDataCollector;
	let focus: WSFile;
	let statObj: WSCountHistory;
	let registered: boolean = false;
	let currentStat: IWordCount;
	let statIndex: number;

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

	function initialize() {
		if (focus instanceof WSFile) {
			statObj = collector.stats.getHistoryItem(focus);
			statIndex = statObj.history.length - 1;
			if (statIndex < 0) {
				currentStat = null;
			} else {
				currentStat = statObj.history[statIndex];
			}
		}
	}

	function nextStat() {
		if (statIndex < statObj.history.length) {
			statIndex += 1;
		}
	}

	function prevStat() {
		if (statIndex > 0) {
			statIndex -= 1;
		}
	}

	function hasNext() {
		return statObj.history.length > statIndex + 1;
	}

	function hasPrev() {
		return statObj.history.length > 0 && statIndex > 0;
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
		if (focus instanceof WSFile) {
			statObj = collector.stats.getHistoryItem(focus);
			currentStat = statObj.current;
		}
	}
</script>

<div class="ws-stat-view">
	<h4>Word Statistics</h4>
	{#if focus instanceof WSFile}
		<div class="ws-sv-stat-obj">
			<p>{focus.path}</p>
			{#if statObj instanceof WSCountHistory}
				<div class="ws-sv-stats">
					<div>Air:</div>
					<div>{FormatNumber(currentStat.air / 1000) + RightWordForNumber(currentStat.air, "second", "seconds")}</div>
					<div>Start Time:</div>
					<div>{new Date(currentStat.startTime).toLocaleString()}</div>
					<div>Start Time: (air)</div>
					<div>{new Date(currentStat.startTime + currentStat.air).toLocaleString()}</div>
					<div>End Time:</div>
					<div>{new Date(currentStat.endTime).toLocaleString()}</div>
					<div>Length:</div>
					<div>{FormatNumber(currentStat.length / 1000) + RightWordForNumber(currentStat.length, "second", "seconds")}</div>
					<div>Closing Time:</div>
					<div>{new Date(currentStat.startTime + currentStat.length).toLocaleString()}</div>
					<div>Start Words:</div>
					<div>{FormatWords(currentStat.startWords)}</div>
					<div>End Words:</div>
					<div>{FormatWords(currentStat.endWords)}</div>
					<div>Words Added:</div>
					<div>{FormatWords(currentStat.wordsAdded)}</div>
					<div>Words Deleted:</div>
					<div>{FormatWords(currentStat.wordsDeleted)}</div>
					<div>Last Word At:</div>
					<div>{new Date(currentStat.lastWordAt).toLocaleString()}</div>
					<div>Writing Time:</div>
					<div>{SecondsToHMS(currentStat.writingTime / 1000)}</div>
				</div>
			{:else}
				<div class="ws-sv-no-history">
					<p>No history.</p>
				</div>
			{/if}
		</div>
	{:else}
		<div>
			<p>No file focused.</p>
		</div>
	{/if}
</div>
