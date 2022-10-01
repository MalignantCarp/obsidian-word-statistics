<script lang="ts">
	import {
		WSEvents,
		WSFocusEvent,
		WSPathEvent,
		WSProjectEvent,
	} from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import ProgressFile from "./ProgressFile.svelte";
	import ProgressPath from "./ProgressPath.svelte";
	import ProgressProject from "./ProgressProject.svelte";

	export let manager: WSProjectManager;
	export let events = manager.plugin.events;

	let panel: ProgressFile;
	let project: WSProject;
	let projects: WSProject[] = [];
	let paths: WSPath[] = [];

	let focus: WSFile;

	let okay = false;

	onMount(() => {
		events.on(WSEvents.Focus.File, onFocus, { filter: null });
		events.on(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.Deleted, onProjectDeleted, { filter: null });
		events.on(WSEvents.Project.IndexSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.PathSet, onProjectUpdate, { filter: null });
		events.on(WSEvents.Project.Updated, onProjectUpdate, { filter: null });
		events.on(WSEvents.Path.Created, onPathUpdate, { filter: null });
		focus = manager.plugin.focusFile;
	});

	onDestroy(() => {
		events.off(WSEvents.Focus.File, onFocus, { filter: null });
		events.off(WSEvents.Project.Created, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.Deleted, onProjectDeleted, {
			filter: null,
		});
		events.off(WSEvents.Project.IndexSet, onProjectUpdate, {
			filter: null,
		});
		events.off(WSEvents.Project.PathSet, onProjectUpdate, { filter: null });
		events.off(WSEvents.Project.Updated, onProjectUpdate, { filter: null });
		events.off(WSEvents.Path.Created, onPathUpdate, { filter: null });
	});

	function onProjectDeleted(event: WSProjectEvent) {
		updateProject();
	}

	function onProjectUpdate(event: WSProjectEvent) {
		updateProject();
	}

	function onPathUpdate(event: WSPathEvent) {
		updateProject();
	}

	function updateProject() {
		projects = manager.getProjectsByFile(focus);
		if (projects.length === 1) {
			project = projects[0];
			paths = manager.getAncestors(manager.getPath(project.path));
		} else {
			project = null;
			paths = [];
		}
	}

	function onFocus(event: WSFocusEvent) {
		focus = event.info.file;
		if (focus instanceof WSFile) {
			updateProject();
		}
	}

	$: if (focus instanceof WSFile) {
		okay = true;
	}

	$: if (focus instanceof WSFile) {
		panel?.FocusFile(focus);
		panel?.updateProject();
		panel?.updateAll();
	}
</script>

{#if okay}
	{#if projects.length === 1}
		{#each paths as path}
			<ProgressPath {manager} {path} />
		{/each}
		<ProgressProject {manager} {project} />
	{/if}
	<ProgressFile {manager} file={focus} bind:this={panel} />
	{#if projects.length > 1}
		<h4>Projects</h4>
		<ul>
			{#each projects as p}
				<li>{p.title}</li>
			{/each}
		</ul>
	{/if}
{/if}
