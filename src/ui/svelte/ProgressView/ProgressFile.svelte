<script lang="ts">
	import { DateTime } from "luxon";
	import type WordStatisticsPlugin from "src/main";
	import {
		WSEvents,
		WSFileEvent,
		WSFolderEvent,
		WSSettingEvent,
	} from "src/model/events";
	import { WSFile } from "src/model/file";
	import { RECORDING, WSFolder } from "src/model/folder";
	import { WordStats } from "src/model/stats";
	import {
		FormatNumber,
		FormatWords,
		MoveTheTarget,
		SecondsToHMS,
	} from "src/util";
	import { onDestroy, onMount } from "svelte";
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

	let startDate: DateTime;
	let endDate: DateTime;

	let updateTime: number = 0;
	let updateFile: WSFile = null;

	let duration: number;
	let netWords: number;

	let startWords: number;
	let endWords: number;

	let wordsAdded: number;
	let wordsDeleted: number;
	let wordsImported: number;
	let wordsExported: number;
	let writingTime: number;

	let WPM: number;
	let WPMA: number;
	let WAPM: number;
	let WAPMA: number;

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

	$: if (
		showStats &&
		file instanceof WSFile &&
		file.hasStats &&
		(file.last.endTime > updateTime || file != updateFile)
	) {
		startDate = DateTime.fromMillis(file.first.startTime);
		endDate = DateTime.fromMillis(file.last.endTime);
		startWords = file.last.startWords;
		endWords = file.last.endWords;
		duration = WordStats.GetDuration(file.stats);
		netWords = WordStats.GetNetWords(file.stats);

		wordsAdded = WordStats.GetWordsAdded(file.stats);
		wordsDeleted = WordStats.GetWordsDeleted(file.stats);
		wordsImported = WordStats.GetWordsImported(file.stats);
		wordsExported = WordStats.GetWordsExported(file.stats);
		writingTime = WordStats.GetWritingTime(file.stats);

		WPM = Math.round(netWords / (duration / 60000));
		WAPM = Math.round(wordsAdded / (duration / 60000));

		WPMA = Math.round(netWords / (writingTime / 60000));
		WAPMA = Math.round(wordsAdded / (writingTime / 60000));
		updateTime = file.last.endTime;
		updateFile = file;
	}

	export function updateAll() {
		let g: number;
		if (file instanceof WSFile) {
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
	<div class="ws-progress-stats">
		{#if showStats && file instanceof WSFile && file.hasStats}
			<div class="heading">Start Time</div>
			<div class="value">
				{startDate.toLocaleString(DateTime.DATETIME_SHORT)}
			</div>
			<div class="heading">End Time</div>
			<div class="value">
				{endDate.toLocaleString(DateTime.DATETIME_SHORT)}
			</div>
			<div class="heading">Start Words</div>
			<div class="value">{FormatWords(startWords)}</div>
			<div class="heading">End Words</div>
			<div class="value">{FormatWords(endWords)}</div>
			<div class="heading">Words Added</div>
			<div class="value">{FormatWords(wordsAdded)}</div>
			<div class="heading">Words Deleted</div>
			<div class="value">{FormatWords(wordsDeleted)}</div>
			<div class="heading">Words Imported</div>
			<div class="value">{FormatWords(wordsImported)}</div>
			<div class="heading">Words Exported</div>
			<div class="value">{FormatWords(wordsExported)}</div>
			<div class="heading">Duration</div>
			<div class="value">{SecondsToHMS(duration / 1000)}</div>
			<div class="heading">Writing Time</div>
			<div class="value">{SecondsToHMS(writingTime / 1000)}</div>
			<div class="heading">WPM</div>
			<div class="value">{FormatWords(WPM)}</div>
			<div class="heading">WAPM</div>
			<div class="value">{FormatWords(WAPM)}</div>
		{/if}
	</div>
</div>
