<script lang="ts">
import { setIcon } from 'obsidian';

	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";
	import { Settings } from "src/settings";
	import { onDestroy, onMount } from "svelte";
	import StatObj from "./StatObj.svelte";

	export let collector: WSDataCollector;
	let focus: WSFile;
	let debugView: StatObj;

	let debugButton: HTMLElement;

	let viewMode: Settings.View.StatisticsPanel.VIEW_MODE;

	onMount(() => {
		collector.plugin.events.on(WSEvents.Focus.File, onFileFocus, { filter: null });
		setIcon(debugButton, "wrench-screwdriver-glyph", 16);
		viewMode = collector.plugin.settings.viewSettings.statistics.viewMode;
	});

	onDestroy(() => {
		collector.plugin.events.off(WSEvents.Focus.File, onFileFocus, { filter: null });
	});

	function onFileFocus(evt: WSFocusEvent) {
		focus = evt.info.file;
		debugView.update(focus);
	}

	function onDebugClick(evt: MouseEvent) {
		viewMode = Settings.View.StatisticsPanel.VIEW_MODE.DEBUG;
		collector.plugin.settings.viewSettings.statistics.viewMode = viewMode;
		collector.plugin.saveSettings();
	}
</script>

<div class="ws-stat-view">
	<p class="ws-heading">Word Statistics</p>
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div class="nav-action-button" class:is-active={viewMode === Settings.View.StatisticsPanel.VIEW_MODE.DEBUG} aria-label="Debug View" bind:this={debugButton} on:click={onDebugClick} />
		</div>
	</div>
	<svelte:component this={StatObj} bind:this={debugView} {focus} {collector} />
</div>
