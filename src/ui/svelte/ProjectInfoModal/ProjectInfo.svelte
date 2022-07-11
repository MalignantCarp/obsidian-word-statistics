<script lang="ts">
	import { WSEvents, WSPathEvent, WSProjectEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";

	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import { PROJECT_CATEGORY_NAME, type WSProject } from "src/model/project";
	import { FormatWords, FormatNumber } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import FileInfo from "./FileInfo.svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;
	export let onClose: () => void;

	let files: WSFile[] = [];

	let path: WSPath;

	let projectWordGoal: number = 0;

	onMount(() => {
		manager.plugin.events.on(WSEvents.Project.CategorySet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.FilesUpdated, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.GoalsSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.IndexSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.PathSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.Renamed, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.TitleSet, onProjectUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Project.Updated, onProjectUpdate, { filter: project });
		path = manager.getPath(project.path);
		manager.plugin.events.on(WSEvents.Path.GoalsSet, onProjectUpdate, { filter: path });
		files = project.files;
		projectWordGoal = manager.getWordGoalForProjectByContext(project);
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
		manager.plugin.events.off(WSEvents.Path.GoalsSet, onProjectUpdate, { filter: path });
	});

	function onProjectUpdate(evt: WSProjectEvent | WSPathEvent) {
		project = project;
		files = project.files;
		if (evt.info.type === WSEvents.Project.PathSet && path.path != project.path) {
			manager.plugin.events.off(WSEvents.Path.GoalsSet, onProjectUpdate, { filter: path });
			path = manager.getPath(project.path);
			manager.plugin.events.on(WSEvents.Path.GoalsSet, onProjectUpdate, { filter: path });
		}
		if (evt.info.type === WSEvents.Path.GoalsSet || evt.info.type === WSEvents.Project.GoalsSet) {
			projectWordGoal = manager.getWordGoalForProjectByContext(project);
		}
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
			{#if projectWordGoal > 0}
				<div>{FormatNumber(project.totalWords)} / {FormatWords(projectWordGoal)}</div>
			{:else}
				<div>{FormatWords(project.totalWords)}</div>
			{/if}
		</div>
	</div>
	{#if files.length > 0}
		<h3>File List</h3>
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
					<FileInfo {file} {manager} {project} />
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td />
					<td class="total-head">Total:</td>
					<td class="word-count">{FormatWords(project.totalWords)}</td>
				</tr>
			</tfoot>
		</table>
	{:else}
		<h3>No files in project.</h3>
	{/if}
	<div class="setting-item">
		<div class="setting-item-control">
			<button on:click={onClose}>Close</button>
		</div>
	</div>
</div>
