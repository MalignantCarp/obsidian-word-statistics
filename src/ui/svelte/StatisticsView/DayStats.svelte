<script lang="ts">
	import { setIcon } from "obsidian";

	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent } from "src/model/event";
	import type { WSTimePeriod } from "src/model/statistics";
	import { Settings } from "src/settings";
	import { FormatWords, GetDateStart, SecondsToHMS } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import { DateTime } from "luxon";

	export let collector: WSDataCollector;

	let viewDate: DateTime;
	let todayStart: number;
	let dayEnd: number;

	let dayHasHistory: boolean = false;

	let stats: WSTimePeriod[];
	let totalDuration: number = 0;
	let totalWordsAdded: number = 0;
	let totalWordsDeleted: number = 0;
	let totalWordsImported: number = 0;
	let totalWordsExported: number = 0;
	let totalWritingTime: number = 0;
	let totalNetWords: number = 0;
	let startWords: number = 0;
	let endWords: number = 0;

	let navPrevious: HTMLElement;
	let navNext: HTMLElement;
	let navYesterday: HTMLElement;
	let navToday: HTMLElement;

	onMount(() => {
		setIcon(navPrevious, "left-chevron-glyph", 20);
		setIcon(navYesterday, "yesterday-glyph", 20);
		setIcon(navToday, "calendar-glyph", 20);
		setIcon(navNext, "right-chevron-glyph", 20);

		viewDate = GetDateStart(DateTime.now());
		collector.plugin.events.on(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
		collector.plugin.events.on(WSEvents.File.WordsUpdated, onWordsChanged, { filter: null });
		todayStart = viewDate.toMillis();
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
		stats = collector.stats.getPeriodsFromDates(viewDate);
		totalDuration = 0;
		totalWordsAdded = 0;
		totalWordsDeleted = 0;
		totalWordsImported = 0;
		totalWordsExported = 0;
		totalWritingTime = 0;
		startWords = stats.first()?.wordsStart || 0;
		endWords = stats.last()?.wordsEnd || 0;
		stats.forEach(period => {
			totalDuration += period.timeEnd - period.timeStart;
			totalWordsAdded += period.wordsAdded;
			totalWordsDeleted += period.wordsDeleted;
			totalWordsImported += period.wordsImported;
			totalWordsExported += period.wordsExported;
			totalWritingTime += period.writingTime;
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

		totalNetWords = totalWordsAdded + totalWordsImported - totalWordsDeleted - totalWordsExported;
	}

	function RolloverCheck(): number {
		let start = DateTime.now();
		let timeCheck = start.toMillis();
		start = GetDateStart(start);
		// if the current view date is today and our new time is over the end of that date
		if (viewDate.toMillis() === todayStart && timeCheck >= dayEnd) {
			viewDate = start;
			todayStart = start.toMillis();
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
		if (timeCheck >= viewDate.toMillis() && timeCheck <= dayEnd) {
			// update the stats
			reloadStats();
		}
	}

	function prevDay() {
		viewDate = GetDateStart(DateTime.fromMillis(viewDate.toMillis() - Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}

	function nextDay() {
		viewDate = GetDateStart(DateTime.fromMillis(viewDate.toMillis() + Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}

	function today() {
		RolloverCheck();
		viewDate = GetDateStart(DateTime.fromMillis(todayStart));
		reloadStats();
	}

	function yesterday() {
		RolloverCheck();
		viewDate = GetDateStart(DateTime.fromMillis(todayStart - Settings.Statistics.DAY_LENGTH));
		reloadStats();
	}
</script>

<div class="ws-sv-date">
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div class="nav-action-button" aria-label="Previous Day" bind:this={navPrevious} on:click={prevDay} />
			<div class="nav-action-button" aria-label="Yesterday" bind:this={navYesterday} on:click={yesterday} />
			<div class="nav-action-button" aria-label="Today" bind:this={navToday} on:click={today} />
			<div class="nav-action-button" aria-label="Next Day" bind:this={navNext} on:click={nextDay} />
		</div>
	</div>

	<p class="ws-title">{viewDate instanceof DateTime ? viewDate.toLocaleString() : ""}</p>
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
			<div>Net Words:</div>
			<div class="ws-sv-value">{FormatWords(totalNetWords)}</div>
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
