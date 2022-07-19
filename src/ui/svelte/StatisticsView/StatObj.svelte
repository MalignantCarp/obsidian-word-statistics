<script lang="ts">
	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSProjectEvent, type WSFileEvent, type WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProject } from "src/model/project";
	import { WSCountHistory, type IWordCount } from "src/model/statistics";
	import { Settings } from "src/settings";
	import { FormatNumber, FormatWords, RightWordForNumber, SecondsToHMS } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let focus: WSFile;
	export let collector: WSDataCollector;

    let project: WSProject;
	let statObj: WSCountHistory;
	let registered: boolean = false;
	let currentStat: IWordCount;
	let statIndex: number;

	onMount(() => {
		RegisterWCEvents();
        collector.plugin.events.on(WSEvents.Project.FilesUpdated, onProjectFilesUpdate, {filter: null});
		initialize();
	});

	onDestroy(() => {
		if (registered) {
			collector.plugin.events.off(WSEvents.File.WordsChanged, onWordCountChange, { filter: focus });
		}
        collector.plugin.events.off(WSEvents.Project.FilesUpdated, onProjectFilesUpdate, {filter: null});
	});

	function RegisterWCEvents() {
		if (focus instanceof WSFile) {
			collector.plugin.events.on(WSEvents.File.WordsChanged, onWordCountChange, { filter: focus });
			registered = true;
		}
	}

	function UnregisterWCEvents() {
		if (focus instanceof WSFile) {
			collector.plugin.events.off(WSEvents.File.WordsChanged, onWordCountChange, { filter: focus });
			registered = false;
		}
	}


	function onProjectFilesUpdate(evt: WSProjectEvent) {
        getProject();
	}

	function getProject() {
		if (focus instanceof WSFile) {
			let projects = collector.manager.getProjectsByFile(focus);
			if (projects.length === 1) {
				project = projects[0];
				return;
			}
		}
		project = null;
	}

	function initialize() {
		if (focus instanceof WSFile) {
			statObj = collector.stats.getHistoryItem(focus);
			statIndex = statObj.history.length - 1;
			if (statIndex < 0) {
				currentStat = null;
			} else {
				currentStat = statObj.history[statIndex];
			}
		}
		getProject();
	}

    export function update(file: WSFile) {
        UnregisterWCEvents();
        focus = file;
        RegisterWCEvents()
        initialize();
    }

	function nextStat(evt: MouseEvent) {
		if (statIndex + 1 < statObj.history.length) {
			statIndex += 1;
			currentStat = statObj.history[statIndex];
		}
	}

	function prevStat(evt: MouseEvent) {
		if (statIndex > 0) {
			statIndex -= 1;
			currentStat = statObj.history[statIndex];
		}
	}

	function onWordCountChange(evt: WSFileEvent) {
		if (registered) {
			statObj = collector.stats.getHistoryItem(focus);
			currentStat = statObj.current;
			statIndex = statObj.history.length - 1;
		}
	}

	$: disabledNext = !statObj || statObj.history.length === 0 || statIndex + 1 >= statObj.history.length;
	$: disabledPrev = statIndex === 0 || (statObj && statObj.history.length === 0);
</script>

{#if focus instanceof WSFile}
	<div class="ws-sv-stat-obj">
		<p class="ws-title">{collector.manager.getTitleForFile(focus, project)}</p>
		<p class="ws-path">{focus.path}</p>
		{#if statObj instanceof WSCountHistory && currentStat !== null}
			<div class="ws-sv-stats">
				<div>Air:</div>
				<div>{FormatNumber(currentStat.air / 1000) + RightWordForNumber(currentStat.air, "second", "seconds")}</div>
				<div>Start Time:</div>
				<div>{new Date(currentStat.startTime).toLocaleString()}</div>
				<div>Start Time: (air)</div>
				<div>{new Date(currentStat.startTime + currentStat.air).toLocaleString()}</div>
				<div>End Time:</div>
				<div>{new Date(currentStat.endTime).toLocaleString()}</div>
				<div>Closing Time:</div>
				<div>{new Date(currentStat.startTime + Settings.Statistics.PERIOD_LENGTH).toLocaleString()}</div>
				<div>Start Words:</div>
				<div>{FormatWords(currentStat.startWords)}</div>
				<div>End Words:</div>
				<div>{FormatWords(currentStat.endWords)}</div>
				<div>Words Added:</div>
				<div>{FormatWords(currentStat.wordsAdded)}</div>
				<div>Words Deleted:</div>
				<div>{FormatWords(currentStat.wordsDeleted)}</div>
				<div>Last Word At:</div>
				<div>{new Date(currentStat.lastWordAt).toLocaleString()}</div>
				<div>Writing Time:</div>
				<div>{SecondsToHMS(currentStat.writingTime / 1000)}</div>
			</div>
			<hr />
			<div class="ws-sv-stats">
				<div><button on:click={prevStat} disabled={disabledPrev}>Previous</button></div>
				<div><button on:click={nextStat} disabled={disabledNext}>Next</button></div>
			</div>
		{:else}
			<div class="ws-sv-no-history">
				<p>No history.</p>
			</div>
		{/if}
	</div>
{:else}
	<div>
		<p>No file focused.</p>
	</div>
{/if}
