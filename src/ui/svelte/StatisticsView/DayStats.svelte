<script lang="ts">
import { setIcon } from 'obsidian';

	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";
	import type { IWordCount } from "src/model/statistics";
	import { Settings } from "src/settings";
	import { FormatWords, GetDateStart, SecondsToHMS } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let collector: WSDataCollector;

	let viewDate: Date;
	let todayStart: number;
	let dayEnd: number;

	let dayHasHistory: boolean = false;

	let stats: Map<WSFile, IWordCount[]>;
	let totalDuration: number = 0;
	let totalWordsAdded: number = 0;
	let totalWordsDeleted: number = 0;
	let totalWordsImported: number = 0;
	let totalWordsExported: number = 0;
	let totalWritingTime: number = 0;
	let startWords: number = 0;
	let endWords: number = 0;

	let navPrevious: HTMLElement;
	let navNext: HTMLElement;
	let navYesterday: HTMLElement;
	let navTomorrow: HTMLElement;
	let navToday: HTMLElement;

	onMount(() => {
		setIcon(navPrevious, "left-chevron-glyph", 20);
		setIcon(navYesterday, "yesterday-glyph", 20);
		setIcon(navToday, "calendar-glyph", 20);
		setIcon(navTomorrow, "tomorrow-glyph", 20);
		setIcon(navNext, "right-chevron-glyph", 20);

		viewDate = GetDateStart(new Date());
		collector.plugin.events.on(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
		collector.plugin.events.on(WSEvents.File.WordsUpdated, onWordsChanged, { filter: null });
		todayStart = viewDate.getTime();
		dayEnd = todayStart + Settings.Statistics.DAY_LENGTH;
		reloadStats();
	});

	onDestroy(() => {
		collector.plugin.events.off(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
		collector.plugin.events.off(WSEvents.File.WordsUpdated, onWordsChanged, { filter: null });
	});

	export function update() {
		reloadStats();
	}

	function reloadStats() {
		stats = collector.stats.getHistoryForTimePeriod(viewDate);
		totalDuration = 0;
		totalWordsAdded = 0;
		totalWordsDeleted = 0;
		totalWordsImported = 0;
		totalWordsExported = 0;
		totalWritingTime = 0;
		startWords = 0;
		endWords = 0;
		stats.forEach((counters, file) => {
			if (counters) {
				startWords += counters.first().startWords;
				endWords += counters.last().endWords;
			}
			counters.forEach(count => {
				totalDuration += count.endTime - (count.startTime + count.air);
				totalWordsAdded += count.wordsAdded;
				totalWordsDeleted += count.wordsDeleted;
				totalWordsImported += count.wordsImported;
				totalWordsExported += count.wordsExported;
				totalWritingTime += count.writingTime;
			});
		});
		// console.log(viewDate);
		dayHasHistory = !(
			startWords === endWords &&
			totalWordsAdded + totalWordsImported + totalWordsDeleted + totalWordsExported === 0 &&
			totalDuration === 0 &&
			totalWritingTime === 0
		);
		if (dayHasHistory) {
			// fix for NaN when one keystroke results in a word count change
			totalDuration = Math.max(totalDuration, 1);
			totalWritingTime = Math.max(totalWritingTime, 1);
		}
	}

	function RolloverCheck(): number {
		let start = new Date();
		let timeCheck = start.getTime();
		start = GetDateStart(start);
		// if the current view date is today and our new time is over the end of that date
		if (viewDate.getTime() === todayStart && timeCheck >= dayEnd) {
			viewDate = start;
			todayStart = start.getTime();
			dayEnd = todayStart + Settings.Statistics.DAY_LENGTH;
			reloadStats();
			return -1;
		}
		return timeCheck;
	}

	function onWordsChanged(evt: WSFileEvent) {
		let timeCheck = RolloverCheck();
		if (timeCheck === -1) {
			return;
		}
		// if we are adding or removing words in the day we are examining
		if (timeCheck >= viewDate.getTime() && timeCheck <= dayEnd) {
			// update the stats
			reloadStats();
		}
	}

	function prevDay() {
		viewDate = GetDateStart(new Date(viewDate.getTime() - Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}

	function nextDay() {
		viewDate = GetDateStart(new Date(viewDate.getTime() + Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}

	function today() {
		RolloverCheck();
		viewDate = GetDateStart(new Date(todayStart));
		reloadStats();
	}

	function yesterday() {
		RolloverCheck();
		viewDate = GetDateStart(new Date(todayStart - Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}

	function tomorrow() {
		RolloverCheck();
		viewDate = GetDateStart(new Date(todayStart + Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}
</script>

<div class="ws-sv-date">
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div class="nav-action-button" aria-label="Previous Day" bind:this={navPrevious} on:click={prevDay} />
			<div class="nav-action-button" aria-label="Yesterday" bind:this={navYesterday} on:click={yesterday} />
			<div class="nav-action-button" aria-label="Today" bind:this={navToday} on:click={today} />
			<div class="nav-action-button" aria-label="Tomorrow" bind:this={navTomorrow} on:click={tomorrow} />
			<div class="nav-action-button" aria-label="Next Day" bind:this={navNext} on:click={nextDay} />
		</div>
	</div>

	<p class="ws-title">{viewDate instanceof Date ? viewDate.toLocaleDateString() : ""}</p>
	{#if dayHasHistory}
		<div class="ws-sv-stats">
			<div>Start Words:</div>
			<div class="ws-sv-value">{FormatWords(startWords)}</div>
			<div>End Words:</div>
			<div class="ws-sv-value">{FormatWords(endWords)}</div>
			<div>Words Added:</div>
			<div class="ws-sv-value">{FormatWords(totalWordsAdded)}</div>
			<div>Words Deleted:</div>
			<div class="ws-sv-value">{FormatWords(totalWordsDeleted)}</div>
			<div>Words Imported:</div>
			<div class="ws-sv-value">{FormatWords(totalWordsImported)}</div>
			<div>Words Exported:</div>
			<div class="ws-sv-value">{FormatWords(totalWordsExported)}</div>
			<div>Writing Time:</div>
			<div class="ws-sv-value">{SecondsToHMS(totalWritingTime / 1000)}</div>
			<div>Logged Time:</div>
			<div class="ws-sv-value">{SecondsToHMS(totalDuration / 1000)}</div>
			<div>Time Writing (%)</div>
			<div class="ws-sv-value">{((totalWritingTime / totalDuration) * 100).toFixed(2) + "%"}</div>
		</div>
	{:else}
		<div class="ws-sv-no-history">
			<p>No writing for this day.</p>
		</div>
	{/if}
</div>
