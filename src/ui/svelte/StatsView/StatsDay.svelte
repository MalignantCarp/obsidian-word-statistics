<script lang="ts">
	import { setIcon } from "obsidian";

	import { WSEvents, WSFileEvent } from "src/model/events";
	import { Settings } from "src/settings";
	import { GetDateStart } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import { DateTime } from "luxon";
	import StatsForDayDisplay from "../StatsForDayDisplay.svelte";
	import type WordStatisticsPlugin from "src/main";
	import type { WSFileStat } from "src/model/file";

    export let plugin: WordStatisticsPlugin;

	let viewDate: DateTime;
	let todayStart: number;
	let dayEnd: number;

    let stats: WSFileStat[] = [];

	let dayHasHistory: boolean = false;

    let display: StatsForDayDisplay;

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
		plugin.events.on(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
		todayStart = viewDate.toMillis();
		dayEnd = todayStart + Settings.Statistics.DAY_LENGTH;
		reloadStats();
	});

	onDestroy(() => {
		plugin.events.off(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
	});

	export function update() {
		reloadStats();
	}

	function reloadStats() {
        stats = plugin.manager.stats.getStatsForDate(viewDate);
        dayHasHistory = stats.length > 0;
        if (dayHasHistory) display?.Update(stats);
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
			<div class="nav-action-button" aria-label="Previous Day" bind:this={navPrevious} on:click={prevDay} on:keypress={prevDay} />
			<div class="nav-action-button" aria-label="Yesterday" bind:this={navYesterday} on:click={yesterday} on:keypress={yesterday}/>
			<div class="nav-action-button" aria-label="Today" bind:this={navToday} on:click={today} on:keypress={today}/>
			<div class="nav-action-button" aria-label="Next Day" bind:this={navNext} on:click={nextDay} on:keypress={today} />
		</div>
	</div>

	<p class="ws-title">{viewDate instanceof DateTime ? viewDate.toLocaleString() : ""}</p>
	{#if dayHasHistory}
		<svelte:component this={StatsForDayDisplay} bind:this={display} {stats}/>
	{:else}
		<div class="ws-sv-no-history">
			<p>No writing for this day.</p>
		</div>
	{/if}
</div>