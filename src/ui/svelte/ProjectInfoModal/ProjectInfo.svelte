<script lang="ts">
	import { WSEvents, WSProjectEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";

	import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_CATEGORY_NAME, type WSProject } from "src/model/project";
	import { FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import FileInfo from "./FileInfo.svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;
	export let onClose: () => void;

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
		files = project.files;
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
	<h1 class="project-title">{project.title}</h1>
	<div class="top-info">
		<div class="path">
			<div class="top-info-heading">Path</div>
			<div>{project.path}</div>
		</div>
		<div class="category">
			<div class="top-info-heading">Category</div>
			<div>{PROJECT_CATEGORY_NAME[project.category]}</div>
		</div>
		<div class="wordcount">
			<div class="top-info-heading">Total Words</div>
			<div>{FormatWords(project.totalWords)}</div>
		</div>
	</div>

	<h2>File List</h2>
	<table class="project-file-table">
		<thead class="table-header">
			<tr>
				<th>Title</th>
				<th>Path</th>
				<th>Word Count</th>
			</tr>
		</thead>
		<tbody>
			{#each files as file, i}
				<FileInfo {file} {manager} />
			{/each}
		</tbody>
	</table>
	<div class="setting-item">
		<div class="setting-item-control">
			<button on:click={onClose}>Close</button>
		</div>
	</div>

</div>
