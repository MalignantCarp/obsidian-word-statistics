<script lang="ts">
	import { WSEvents, WSFileEvent, WSProjectEvent } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let path: WSPath;
	export let manager: WSProjectManager;
	export let onWordCountUpdate: (count: number) => void = null;

	let wordCount = "";

	let projects: WSProject[] = [];

	onMount(() => {
		manager.plugin.events.on(WSEvents.File.WordsChanged, updateWords, { filter: null });
		manager.plugin.events.on(WSEvents.Project.PathSet, updateProjects, { filter: null });
		manager.plugin.events.on(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.on(WSEvents.Path.GoalsSet, updateWords, { filter: null});
		updateProjects();
		updateWords;
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.File.WordsChanged, updateWords, { filter: null });
		manager.plugin.events.off(WSEvents.Project.PathSet, updateProjects, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.off(WSEvents.Path.GoalsSet, updateWords, { filter: null});
	});

	function updateProjects(event?: WSProjectEvent) {
		projects = path != manager.pathRoot ? manager.getProjectsByPath(path.path) : manager.getAllProjects();
		updateWords();
	}

	function updateWords(event?: WSFileEvent) {
		let count = 0;
		projects.forEach(project => {
			count += project.totalWords;
		});
		wordCount = FormatWords(count);
		if (onWordCountUpdate) {
			onWordCountUpdate(count);
		}
	}
</script>

<div class="ws-path-word-count">{wordCount}</div>
