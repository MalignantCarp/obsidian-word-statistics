<script lang="ts">
	import { setIcon, View } from "obsidian";

	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";
	import { Settings } from "src/settings";
	import { onDestroy, onMount } from "svelte";
	import DayStats from "./DayStats.svelte";
	import StatObj from "./StatObj.svelte";

	export let collector: WSDataCollector;
	let focus: WSFile;
	let debugView: StatObj;
	let dayView: DayStats;

	let debugButton: HTMLElement;
	let dayButton: HTMLElement;

	let viewMode: Settings.View.StatisticsPanel.VIEW_MODE;

	onMount(() => {
		collector.plugin.events.on(WSEvents.Focus.File, onFileFocus, { filter: null });
		setIcon(debugButton, "wrench-screwdriver-glyph", 16);
		setIcon(dayButton, "calendar-glyph", 16);
		viewMode = collector.plugin.settings.viewSettings.statistics.viewMode;
	});

	onDestroy(() => {
		collector.plugin.events.off(WSEvents.Focus.File, onFileFocus, { filter: null });
	});

	function onFileFocus(evt: WSFocusEvent) {
		focus = evt.info.file;
		if (viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DEBUG) {
			debugView.update(focus);
		} else if (viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DAY) {
			dayView.update();
		}
	}

	function onDebugClick(evt: MouseEvent) {
		viewMode = Settings.View.StatisticsPanel.VIEW_MODE.DEBUG;
		collector.plugin.settings.viewSettings.statistics.viewMode = viewMode;
		collector.plugin.saveSettings();
	}

	function onDayClick(evt: MouseEvent) {
		viewMode = Settings.View.StatisticsPanel.VIEW_MODE.DAY;
		collector.plugin.settings.viewSettings.statistics.viewMode = viewMode;
		collector.plugin.saveSettings();
	}
</script>

<div class="ws-stat-view">
	<p class="ws-heading">Word Statistics</p>
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div
				class="nav-action-button"
				class:is-active={viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DEBUG}
				aria-label="Debug View"
				bind:this={debugButton}
				on:click={onDebugClick}
			/>
			<div
				class="nav-action-button"
				class:is-active={viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DAY}
				aria-label="Day View"
				bind:this={dayButton}
				on:click={onDayClick}
			/>
		</div>
	</div>
	{#if viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DEBUG}
		<svelte:component this={StatObj} bind:this={debugView} {focus} {collector} />
	{:else if viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DAY}
		<svelte:component this={DayStats} bind:this={dayView} {collector} />
	{/if}
</div>
