<script lang="ts">
	import { WSEvents, WSProjectEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";

	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import FileInfo from "./FileInfo.svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;

	let files: WSFile[] = [];

	onMount(() => {
		manager.plugin.events.on(WSEvents.Project.CategorySet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.FilesUpdated, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.GoalsSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.IndexSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.PathSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.Renamed, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.TitleSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.Updated, onProjectUpdate, { filter: project });
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.Project.CategorySet, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.FilesUpdated, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.GoalsSet, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.IndexSet, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.PathSet, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.Renamed, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.TitleSet, onProjectUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Project.Updated, onProjectUpdate, { filter: project });
	});

	function onProjectUpdate(evt: WSProjectEvent) {
		project = project;
		files = project.files;
	}
</script>

<div class="ws-project-info">
	<div class="project-title">{project.title}</div>
	{#each files as file, i}
		<FileInfo {file} {manager} />
	{/each}
</div>
