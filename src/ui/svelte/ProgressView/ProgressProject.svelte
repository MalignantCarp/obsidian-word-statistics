<script lang="ts">
	import {
		WSEvents,
		WSFileEvent,
		WSPathEvent,
		WSProjectEvent,
	} from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
	import { FormatNumber, FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import ProgressBar from "../util/ProgressBar.svelte";
	import ProgressPath from "./ProgressPath.svelte";

	export let manager: WSProjectManager;
	export let project: WSProject;

	let events = manager.plugin.events;
    let label: string = "";
	let count: number = 0;
	let goal: number = 0;
	let goalText: string = "";
	let countText: string = "";

	let progress: ProgressBar;

	onMount(() => {
		events.on(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.on(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.on(WSEvents.File.GoalsSet, onFileUpdate, { filter: null });
		events.on(WSEvents.File.Renamed, onFileUpdate, { filter: null });
		events.on(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.GoalsSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.IndexSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.PathSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.Renamed, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.TitleSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.Updated, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.CategorySet, onProjectUpdate, {
			filter: null,
		});
		events.on(WSEvents.Project.FilesUpdated, onProjectFilesUpdate, {
			filter: null,
		});
		events.on(WSEvents.Path.Cleared, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Created, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Deleted, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.GoalsSet, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Set, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Titled, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Updated, onPathUpdate, { filter: null });
        UpdateCount();
	});

	onDestroy(() => {
		events.off(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.off(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.off(WSEvents.File.GoalsSet, onFileUpdate, { filter: null });
		events.off(WSEvents.File.Renamed, onFileUpdate, { filter: null });
		events.off(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.GoalsSet, onProjectUpdate, {
			filter: null,
		});
		events.off(WSEvents.Project.IndexSet, onProjectUpdate, {
			filter: null,
		});
		events.off(WSEvents.Project.PathSet, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.Renamed, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.TitleSet, onProjectUpdate, {
			filter: null,
		});
		events.off(WSEvents.Project.Updated, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.CategorySet, onProjectUpdate, {
			filter: null,
		});
		events.off(WSEvents.Project.FilesUpdated, onProjectFilesUpdate, {
			filter: null,
		});
		events.off(WSEvents.Path.Cleared, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Created, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Deleted, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.GoalsSet, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Set, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Titled, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Updated, onPathUpdate, { filter: null });
	});

	function onCountUpdate(evt: WSFileEvent) {
		if (!project.files.contains(evt.info.file)) return;
		UpdateCount();
	}

	function onFileDeleted(evt: WSFileEvent) {
		if (!project.files.contains(evt.info.file)) return;
		onCountUpdate(evt);
	}

	function onFileUpdate(evt: WSFileEvent) {
		if (!project.files.contains(evt.info.file)) return;
		onCountUpdate(evt);
	}

    function UpdateCount() {
		count = project.totalWords;

		let g = manager.getWordGoalForProjectByContext(project);
		if (g === undefined) {
			goal = Math.ceil(count / 10) * 10;
			goalText = FormatWords(goal);
		} else {
			goal = g;
			goalText = FormatWords(goal);
		}

		countText = goal > 0 ? FormatNumber(count) : FormatWords(count);
		label = goal > 0 ? countText + " / " + goalText : countText;
		progress.SetProgress(goal > 0 ? (count / goal) * 100 : 0);
	}

	function onProjectUpdate(evt: WSProjectEvent) {
		if (project !== evt.info.project) return;
        UpdateCount();
	}

	function onProjectFilesUpdate(evt: WSProjectEvent) {
		if (project !== evt.info.project) return;
        UpdateCount();
	}

	function onPathUpdate(evt: WSPathEvent) {
		if (!evt.info.path.path.startsWith(project.path)) return;
        UpdateCount();
	}
</script>
<div class="ws-progress-project">
	<h3>{project.title}</h3>
	<ProgressBar bind:this={progress} />
    <div class="ws-progress-label">{label}</div>
</div>
