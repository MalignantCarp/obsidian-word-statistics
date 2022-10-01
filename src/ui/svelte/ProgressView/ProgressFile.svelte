<script lang="ts">
	import {
		WSEvents,
		WSFileEvent,
		WSPathEvent,
		WSProjectEvent,
	} from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSPath } from "src/model/path";
	import { WSProject } from "src/model/project";
	import { FormatNumber, FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import ProgressBar from "../util/ProgressBar.svelte";

	export let manager: WSProjectManager;
	export let events = manager.plugin.events;

	export let file: WSFile;

	let project: WSProject;
	let projects: WSProject[] = [];
	let path: WSPath;

	let progress: ProgressBar;
	let goal: number;
	let goalText: string = "";

	let count: number = 0;
	let countText = "";

	let label: string = "";

	onMount(() => {
		events.on(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.on(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.on(WSEvents.File.GoalsSet, onFileUpdate, { filter: null });
		events.on(WSEvents.File.Renamed, onFileUpdate, { filter: null });
		events.on(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.Deleted, onProjectDeleted, { filter: null });
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
	});

	onDestroy(() => {
		events.off(WSEvents.File.WordsChanged, onCountUpdate, { filter: null });
		events.off(WSEvents.File.Deleted, onFileDeleted, { filter: null });
		events.off(WSEvents.File.GoalsSet, onFileUpdate, { filter: null });
		events.off(WSEvents.File.Renamed, onFileUpdate, { filter: null });
		events.off(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.Deleted, onProjectDeleted, {
			filter: null,
		});
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

	export function FocusFile(newFile: WSFile) {
		file = newFile;
	}

	function onCountUpdate(event: WSFileEvent) {
		if (event.info.file !== file) return;
		updateAll();
	}

	function onFileDeleted(event: WSFileEvent) {
		if (event.info.file === file) {
			file = null;
		}
		updateAll();
	}

	function onProjectDeleted(event: WSProjectEvent) {
		if (event.info.project === project) {
			project = null;
		}
		if (projects.contains(event.info.project)) {
			projects.remove(event.info.project);
		}
		updateAll();
	}

	function onFileUpdate(event: WSFileEvent) {
		if (event.info.file !== file) return;
		file = event.info.file;
	}

	function onProjectUpdate(event: WSProjectEvent) {
		if (!(event.info.project instanceof WSProject)) return;
		if (event.info.project !== project) return;
		project = event.info.project;
		updateAll();
	}

	function onProjectFilesUpdate(event: WSProjectEvent) {
		if (!(event.info.project instanceof WSProject)) return;
		if (!event.info.project.files.contains(file)) return;
		updateProject();
		updateAll();
	}

	export function updateProject() {
		projects = manager.getProjectsByFile(file);
		if (projects.length === 1) {
			project = projects[0];
		} else {
			project = null;
		}
	}

	function onPathUpdate(event: WSPathEvent) {
		if (event.info.path! instanceof WSPath) return;
		if (event.info.path === path) {
			path = event.info.path;
			return;
		}
	}

	export function updateAll() {
		let g: number;
		if (file instanceof WSFile) {
			count = file.words;
			g = manager.getWordGoalForFileByContext(file, project);
			if (g === undefined) {
				goal = Math.ceil(count / 10) * 10;
			} else {
				goal = g;
			}
			goalText = FormatWords(goal);
			countText = goal > 0 ? FormatNumber(count) : FormatWords(count);
			label = goal > 0 ? countText + " / " + goalText : countText;
			progress?.SetProgress(goal > 0 ? (count / goal) * 100 : 0);
		} else {
			countText = "";
			label = "";
		}
	}
</script>

<div class="ws-progress-file">
	<h4>{file.title}</h4>
	<ProgressBar bind:this={progress} />
	<div class="ws-progress-label">{label}</div>
</div>
