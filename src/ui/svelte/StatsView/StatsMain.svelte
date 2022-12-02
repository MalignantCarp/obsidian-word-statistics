<script lang="ts">
	import { setIcon, View } from "obsidian";
	import type WordStatisticsPlugin from "src/main";

	import { WSEvents, WSFileEvent, WSFocusEvent } from "src/model/events";
	import type { WSFile } from "src/model/file";
	import { Settings } from "src/settings";
	import { onDestroy, onMount } from "svelte";
	import StatsDay from "./StatsDay.svelte";
	import StatsDebug from "./StatsDebug.svelte";

	export let plugin: WordStatisticsPlugin;
	let focus: WSFile;
	let debugView: StatsDebug;
	let dayView: StatsDay;

	let debugButton: HTMLElement;
	let dayButton: HTMLElement;

	let viewMode: Settings.View.StatisticsPanel.VIEW_MODE;

	onMount(() => {
		plugin.events.on(WSEvents.Focus.File, onFileFocus, { filter: null });
		setIcon(debugButton, "wrench-screwdriver-glyph", 16);
		setIcon(dayButton, "calendar-glyph", 16);
		viewMode = plugin.settings.view.statistics.mode;
	});

	onDestroy(() => {
		plugin.events.off(WSEvents.Focus.File, onFileFocus, { filter: null });
	});

	function onFileFocus(evt: WSFocusEvent) {
		focus = evt.info.file;
		if (viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DEBUG) {
			debugView?.update(focus);
		} else if (viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DAY) {
			dayView?.update();
		}
	}

	function onDebugPress(evt: MouseEvent | KeyboardEvent) {
		viewMode = Settings.View.StatisticsPanel.VIEW_MODE.DEBUG;
		plugin.settings.view.statistics.mode = viewMode;
		plugin.saveSettings();
	}

	function onDayPress(evt: MouseEvent | KeyboardEvent) {
		viewMode = Settings.View.StatisticsPanel.VIEW_MODE.DAY;
		plugin.settings.view.statistics.mode = viewMode;
		plugin.saveSettings();
	}
</script>

<div class="ws-stat-view">
	<p class="ws-heading">Word Statistics</p>
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div
				class="nav-action-button"
				class:is-active={viewMode ===
					Settings.View.StatisticsPanel.VIEW_MODE.DEBUG}
				aria-label="Debug View"
				bind:this={debugButton}
				on:click={onDebugPress}
				on:keypress={onDebugPress}
			/>
			<div
				class="nav-action-button"
				class:is-active={viewMode ===
					Settings.View.StatisticsPanel.VIEW_MODE.DAY}
				aria-label="Day View"
				bind:this={dayButton}
				on:click={onDayPress}
				on:keypress={onDayPress}
			/>
		</div>
	</div>
	{#if viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DEBUG}
		<svelte:component
			this={StatsDebug}
			bind:this={debugView}
			{focus}
			{plugin}
		/>
	{:else if viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DAY}
		<svelte:component this={StatsDay} bind:this={dayView} {plugin} />
	{/if}
</div>
