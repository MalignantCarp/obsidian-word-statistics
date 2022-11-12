<script lang="ts">
	import type WordStatisticsPlugin from "src/main";
	import { WSEvents, WSFolderEvent, WSSettingEvent } from "src/model/events";
	import { RECORDING, WSFolder } from "src/model/folder";
	import { FormatNumber, FormatWords, MoveTheTarget } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import CachedStatsDisplay from "../CachedStatsDisplay.svelte";
	import ProgressBar from "./ProgressBar.svelte";

	export let plugin: WordStatisticsPlugin;
	export let events = plugin.events;

	export let folder: WSFolder;
	export let showStats: boolean = true;

	let statsDisplay: CachedStatsDisplay;

	let progress: ProgressBar;
	let goal: number;
	let goalText: string = "";

	let count: number = 0;
	let countText = "";

	let label: string = "";

	let title = folder.getTitle();
	let name = folder.name;

	let inherit: boolean;
	let recording: boolean;

	onMount(() => {
		events.on(WSEvents.Folder.WordsChanged, onFolderUpdate, {
			filter: null,
		});
		events.on(WSEvents.Folder.Renamed, onFolderUpdate, { filter: null });
		events.on(WSEvents.Folder.GoalSet, onFolderUpdate, { filter: null });
		events.on(WSEvents.Folder.TitleSet, onFolderUpdate, { filter: null });
		events.on(WSEvents.Setting.Recording, onSettingUpdate, {
			filter: null,
		});
		events.on(WSEvents.Setting.MovingTarget, onSettingUpdate, {
			filter: null,
		});
		events.on(WSEvents.Folder.RecordingSet, onFolderUpdate, {
			filter: null,
		});
		updateAll();
	});

	onDestroy(() => {
		events.off(WSEvents.Folder.WordsChanged, onFolderUpdate, {
			filter: null,
		});
		events.off(WSEvents.Folder.Renamed, onFolderUpdate, { filter: null });
		events.off(WSEvents.Folder.GoalSet, onFolderUpdate, { filter: null });
		events.off(WSEvents.Folder.TitleSet, onFolderUpdate, { filter: null });
		events.off(WSEvents.Setting.Recording, onSettingUpdate, {
			filter: null,
		});
		events.off(WSEvents.Setting.MovingTarget, onSettingUpdate, {
			filter: null,
		});
		events.off(WSEvents.Folder.RecordingSet, onFolderUpdate, {
			filter: null,
		});
	});

	function onSettingUpdate(event: WSSettingEvent) {
		updateAll();
	}

	function onFolderUpdate(event: WSFolderEvent) {
		if (!(event.info.folder instanceof WSFolder)) return;
		updateAll();
	}

	export function updateAll() {
		if (folder instanceof WSFolder) {
			if (folder.startTime === 0) folder.recalculateStats();
			let g: number;
			title = folder.getTitle();
			name = folder.name;

			count = folder.wordCount;
			g = folder.getWordGoal();
			if (g === 0 && plugin.settings.view.movingTarget) {
				goal = MoveTheTarget(count);
			} else {
				goal = g;
			}
			goalText = FormatWords(goal);
			countText = goal > 0 ? FormatNumber(count) : FormatWords(count);
			label = goal > 0 ? countText + " / " + goalText : countText;
			progress?.SetProgress(
				goal > 0 ? (count / goal) * 100 : 0,
				goal === 0
			);
			inherit = folder.recording === RECORDING.INHERIT;
			recording = folder.isRecording;
		} else {
			countText = "";
			label = "";
		}
		folder = folder;
	}

	$: if (showStats && folder instanceof WSFolder && folder.duration > 0) {
		// console.log("Running update on ", folder.path, statsDisplay, folder);
		statsDisplay?.Update(folder);
	}
</script>

<div class="ws-progress-folder">
	<h2>
		<span
			class="record"
			class:recording={recording && !inherit}
			class:inherit={recording && inherit}
		/>{title}
	</h2>
	{#if title != name}
		<h3 class="ws-progress-folder-name">({name})</h3>
	{/if}
	<ProgressBar bind:this={progress} />
	<div class="ws-progress-label">{label}</div>
	{#if showStats && folder instanceof WSFolder && folder.duration > 0}
		<CachedStatsDisplay updateObject={folder} bind:this={statsDisplay} />
	{/if}
</div>
