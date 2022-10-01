<script lang="ts">
	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSStatEvent, type WSFileEvent } from "src/model/event";
	import { WSTimePeriod, type IFileWrapper } from "src/model/statistics";
	import { FormatWords, SecondsToHMS } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import FileWrapper from "./FileWrapper.svelte";
	import { DateTime } from "luxon";

	export let collector: WSDataCollector;

	let livePeriod: WSTimePeriod;
	let focusPeriod: WSTimePeriod;
	let periodIndex: number = -1;
	let files: IFileWrapper[] = [];

	let disabledNext: boolean;
	let disabledPrev: boolean;

	onMount(() => {
		collector.plugin.events.on(WSEvents.Stats.FileTouch, onFileTouch, { filter: null });
		collector.plugin.events.on(WSEvents.File.WordsChanged, onWordCountChange, { filter: null });
		collector.plugin.events.on(WSEvents.File.WordsUpdated, onWordCountChange, { filter: null });
		livePeriod = collector.stats.currentPeriod;
		focusPeriod = livePeriod;
		periodIndex = periodIndex;
		files = livePeriod?.files || [];
	});

	onDestroy(() => {
		collector.plugin.events.off(WSEvents.Stats.FileTouch, onFileTouch, { filter: null });
		collector.plugin.events.off(WSEvents.File.WordsChanged, onWordCountChange, { filter: null });
		collector.plugin.events.off(WSEvents.File.WordsUpdated, onWordCountChange, { filter: null });
	});

	function onFileTouch(evt: WSStatEvent) {
		// only need to live-update when the current period is in view
		if (periodIndex === -1) {
			livePeriod = collector.stats.currentPeriod;
			focusPeriod = livePeriod;
			files = livePeriod?.files || [];
		}
	}

	function nextStat(evt: MouseEvent) {
		let oldIndex = periodIndex;
		periodIndex = Math.min(-1, periodIndex + 1);
		if (periodIndex !== oldIndex) {
			focusPeriod = collector.stats.periods.slice(periodIndex).first();
			files = focusPeriod?.files || [];
		}
		// console.log(statObj);
	}

	function prevStat(evt: MouseEvent) {
		let oldIndex = periodIndex;
		periodIndex = Math.max(periodIndex - 1, -collector.stats.periods.length);
		if (periodIndex !== oldIndex) {
			focusPeriod = collector.stats.periods.slice(periodIndex).first();
			files = focusPeriod?.files || [];
		}
		// console.log(statObj);
	}

	function onWordCountChange(evt: WSFileEvent) {
		livePeriod = collector.stats.currentPeriod;
		if (periodIndex === -1) {
			focusPeriod = livePeriod;
			files = livePeriod?.files || [];
		}
		periodIndex = periodIndex;
	}

	$: if (periodIndex === -1) {
		disabledNext = true;
	} else {
		disabledNext = false;
	}

	$: if (-periodIndex === collector.stats.periods.length) {
		disabledPrev = true;
	} else {
		disabledPrev = false;
	}
</script>

<div class="ws-sv-time-period">
	{#if focusPeriod instanceof WSTimePeriod}
		<div class="ws-sv-stats">
			<div class="ws-sv-stat-button"><button on:click={prevStat} disabled={disabledPrev}>Previous</button></div>
			<div class="ws-sv-stat-button"><button on:click={nextStat} disabled={disabledNext}>Next</button></div>
		</div>
		<hr />
		<div class="ws-sv-stats">
			<div>Base Time:</div>
			<div class="ws-sv-value">{DateTime.fromMillis(focusPeriod.base).toLocaleString(DateTime.DATETIME_SHORT)}</div>
			<div>Start Time:</div>
			<div class="ws-sv-value">{DateTime.fromMillis(focusPeriod.timeStart).toLocaleString(DateTime.DATETIME_SHORT)}</div>
			<div>End Time:</div>
			<div class="ws-sv-value">{DateTime.fromMillis(focusPeriod.timeEnd).toLocaleString(DateTime.DATETIME_SHORT)}</div>
			<div>Expiry:</div>
			<div class="ws-sv-value">{DateTime.fromMillis(focusPeriod.expiry).toLocaleString(DateTime.DATETIME_SHORT)}</div>
			<div>Start Words:</div>
			<div class="ws-sv-value">{FormatWords(focusPeriod.wordsStart)}</div>
			<div>End Words:</div>
			<div class="ws-sv-value">{FormatWords(focusPeriod.wordsEnd)}</div>
			<div>Words Added:</div>
			<div class="ws-sv-value">{FormatWords(focusPeriod.wordsAdded)}</div>
			<div>Words Deleted:</div>
			<div class="ws-sv-value">{FormatWords(focusPeriod.wordsDeleted)}</div>
			<div>Words Imported:</div>
			<div class="ws-sv-value">{FormatWords(focusPeriod.wordsImported)}</div>
			<div>Words Exported:</div>
			<div class="ws-sv-value">{FormatWords(focusPeriod.wordsExported)}</div>
			<div>Last Word At:</div>
			<div class="ws-sv-value">{DateTime.fromMillis(focusPeriod.wordsUpdatedAt).toLocaleString(DateTime.DATETIME_SHORT)}</div>
			<div>Writing Time:</div>
			<div class="ws-sv-value">{SecondsToHMS(focusPeriod.writingTime / 1000)}</div>
		</div>
		<hr />
		<div class="ws-sv-debug-files">
			<div class="ws-sv-debug-files-head">Files</div>
			<div class="ws-sv-debug-files-list">
				{#each files as wrapper}
					<FileWrapper {wrapper} />
				{/each}
			</div>
		</div>
	{:else}
		<div class="ws-sv-no-history">
			<p>No history.</p>
		</div>
	{/if}
</div>
