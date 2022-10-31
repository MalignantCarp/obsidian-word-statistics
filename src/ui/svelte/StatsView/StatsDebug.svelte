<script lang="ts">
	import type WordStatisticsPlugin from "src/main";
	import { WSEvents, WSFileEvent } from "src/model/events";
	import { WSFileStat, type WSFile } from "src/model/file";
	import { onDestroy, onMount } from "svelte";
	import DebugStatDisplay from "../DebugStatDisplay.svelte";

	export let plugin: WordStatisticsPlugin;
	export let focus: WSFile;

	let display: DebugStatDisplay;

	let disabledNext: boolean;
	let disabledPrev: boolean;
	let statIndex: number = -1;
	let liveStat: WSFileStat;
	let focusStat: WSFileStat;

	onMount(() => {
		plugin.events.on(WSEvents.File.WordsChanged, onWordCountChange, {
			filter: null,
		});
	});

	onDestroy(() => {
		plugin.events.off(WSEvents.File.WordsChanged, onWordCountChange, {
			filter: null,
		});
	});

	export function update(newFocus: WSFile) {
		focus = newFocus;
		focusStat = focus.last;
		liveStat = focusStat;
		statIndex = -1;
	}

	function nextStat(evt: MouseEvent) {
		let oldIndex = statIndex;
		statIndex = Math.min(-1, statIndex + 1);
		if (statIndex !== oldIndex) {
			focusStat = focus.stats.slice(statIndex).first();
			display.Update(focusStat);
		}
		// console.log(statObj);
	}

	function prevStat(evt: MouseEvent) {
		let oldIndex = statIndex;
		statIndex = Math.max(statIndex - 1, -focus.stats.length);
		if (statIndex !== oldIndex) {
			focusStat = focus.stats.slice(statIndex).first();
			display.Update(focusStat);
		}
		// console.log(statObj);
	}

	function onWordCountChange(evt: WSFileEvent) {
		liveStat = focus.last;
		if (statIndex === -1) {
			focusStat = liveStat;
			display.Update(focusStat);
		}
		statIndex = statIndex;
	}

	$: if (statIndex === -1) {
		disabledNext = true;
	} else {
		disabledNext = false;
	}

	$: if (-statIndex === focus?.stats.length) {
		disabledPrev = true;
	} else {
		disabledPrev = false;
	}
</script>

{#if focusStat instanceof WSFileStat}
	<div class="ws-debug-buttons">
		<div class="ws-stat-button">
			<button on:click={prevStat} disabled={disabledPrev}>Previous</button
			>
		</div>
		<div class="ws-stat-button">
			<button on:click={nextStat} disabled={disabledNext}>Next</button>
		</div>
	</div>
	<hr />
	<svelte:component
		this={DebugStatDisplay}
		updateObject={focusStat}
		bind:this={display}
	/>
{:else}
	<div>No file focused.</div>
{/if}
