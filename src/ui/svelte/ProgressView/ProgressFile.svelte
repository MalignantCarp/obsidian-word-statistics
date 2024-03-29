<script lang="ts">
	import type WordStatisticsPlugin from "src/main";
	import {
		WSEvents,
		WSFileEvent,
		WSFolderEvent,
		WSSettingEvent,
	} from "src/model/events";
	import { WSFile } from "src/model/file";
	import { RECORDING, WSFolder } from "src/model/folder";
	import { FormatNumber, FormatWords, MoveTheTarget } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import CachedStatsDisplay from "../CachedStatsDisplay.svelte";
	import ProgressBar from "./ProgressBar.svelte";

	export let plugin: WordStatisticsPlugin;
	export let file: WSFile;
	export let showStats: boolean = true;

	let events = plugin.events;

	let progress: ProgressBar;
	let goal: number;
	let goalText: string = "";

	let count: number = 0;
	let countText = "";

	let label: string = "";

	let inherit = false;
	let recording = false;

	let statsDisplay: CachedStatsDisplay;

	onMount(() => {
		events.on(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.on(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.on(WSEvents.File.GoalSet, onFileUpdate, { filter: null });
		events.on(WSEvents.File.Renamed, onFileUpdate, { filter: null });
		events.on(WSEvents.Folder.GoalSet, onFolderUpdate, { filter: null });
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
		events.off(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.off(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.off(WSEvents.File.GoalSet, onFileUpdate, { filter: null });
		events.off(WSEvents.File.Renamed, onFileUpdate, { filter: null });
		events.off(WSEvents.Folder.GoalSet, onFolderUpdate, { filter: null });
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

	export function FocusFile(newFile: WSFile) {
		file = newFile;
		updateAll();
	}

	function onSettingUpdate(event: WSSettingEvent) {
		updateAll();
	}

	function onCountUpdate(event: WSFileEvent) {
		if (event.info.file !== file) return;
		file = file;
		updateAll();
	}

	function onFileDeleted(event: WSFileEvent) {
		if (event.info.file === file) {
			file = null;
		}
		updateAll();
	}

	function onFileUpdate(event: WSFileEvent) {
		// console.log(Date.now(), event);
		if (event.info.file !== file) return;
		file = event.info.file;
		updateAll();
	}

	function onFolderUpdate(event: WSFolderEvent) {
		if (!(event.info.folder instanceof WSFolder)) return;
		if (event.info.folder !== file.parent) return;
		file = file;
		updateAll();
	}

	$: if (showStats && file instanceof WSFile && file.hasStats) {
		// console.log("Running update on ", file.path, statsDisplay, file);
		statsDisplay?.Update(file);
	}

	export function updateAll() {
		let g: number;
		if (file instanceof WSFile) {
			if (file.startTime === 0) file.recalculateStats();
			count = file.wordCount;
			g = file.getWordGoal();
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
			inherit = file?.parent.recording === RECORDING.INHERIT;
			recording = file?.parent.isRecording;
		} else {
			countText = "";
			label = "";
		}
	}
</script>

<div class="ws-progress-file">
	<h2>
		<span
			class="record"
			class:recording={recording && !inherit}
			class:inherit={recording && inherit}
		/>{file?.getTitle()}
	</h2>
	<ProgressBar bind:this={progress} />
	<div class="ws-progress-label">{label}</div>
	{#if showStats && file instanceof WSFile && file.hasStats}
		<CachedStatsDisplay updateObject={file} bind:this={statsDisplay} />
	{/if}
</div>
