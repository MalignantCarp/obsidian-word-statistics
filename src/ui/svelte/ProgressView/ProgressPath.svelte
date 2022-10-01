<script lang="ts">
	import { WSEvents, WSFileEvent, WSPathEvent, WSProjectEvent, type Dispatcher } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { FormatNumber, FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import ProgressBar from "../util/ProgressBar.svelte";

	export let manager: WSProjectManager;
	export let path: WSPath;

	let events: Dispatcher;

    let progress: ProgressBar;
    let count: number = 0;
    let countText: string = "";
    let goal: number = 0;
    let goalText: string = "";
    let label: string = "";

    let projects: WSProject[] = [];

	onMount(() => {
		events = manager.plugin.events;
		events.on(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.on(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.on(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.IndexSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.PathSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.FilesUpdated, onProjectFilesUpdate, {
			filter: null,
		});
		events.on(WSEvents.Path.Cleared, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Created, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Deleted, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.GoalsSet, onPathUpdate, { filter: null });
		events.on(WSEvents.Path.Titled, onPathUpdate, { filter: null });
        projects = manager.getProjectsByPath(path.path);
        UpdateCount();
	});

	onDestroy(() => {
		events.off(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.off(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.off(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.IndexSet, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.PathSet, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.FilesUpdated, onProjectFilesUpdate, {
			filter: null,
		});
		events.off(WSEvents.Path.Cleared, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Created, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Deleted, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.GoalsSet, onPathUpdate, { filter: null });
		events.off(WSEvents.Path.Titled, onPathUpdate, { filter: null });
	});

    function onCountUpdate(event: WSFileEvent) {
        UpdateCount();
    }

    function onFileDeleted(event: WSFileEvent) {
        UpdateCount();
    }

    function onProjectUpdate(event: WSProjectEvent) {
		projects = manager.getProjectsByPath(path.path);
        UpdateCount();
    }

    function onProjectFilesUpdate(event: WSProjectEvent) {
        UpdateCount();
    }

    function onPathUpdate(event: WSPathEvent) {
        if (event.info.path !== path) return;
        path = event.info.path;
		projects = manager.getProjectsByPath(path.path);
    }

    function UpdateCount() {
        let newCount = 0;
        for (let proj of projects) {
            newCount += proj.totalWords;
        }
        count = newCount;

        let g = manager.getWordGoalForPath(path);
		if (g === undefined) {
			goal = Math.ceil(count / 10) * 10;
		} else {
			goal = g;
		}

        goalText = FormatWords(goal);
		countText = goal > 0 ? FormatNumber(count) : FormatWords(count);
		label = goal > 0 ? countText + " / " + goalText : countText;
		progress.SetProgress(goal > 0 ? (count / goal) * 100 : 0);
    }
</script>
<div class="ws-progress-path">
    <h2>{path.title}</h2>
	<ProgressBar bind:this={progress} />
    <div class="ws-progress-label">{label}</div>
</div>