<script lang="ts">
	import { WSEvents } from "src/event";
	import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_TYPE_NAME_PLURAL, WSProject, WSPType } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import PmProjectListItem from "./PMProjectListItem.svelte";

	export let type: WSPType;
	export let manager: WSProjectManager;

	let projects: WSProject[] = [];

	onMount(() => {
		resetProjects();
		manager.plugin.events.on(WSEvents.Project.Deleted, resetProjects, { filter: null });
		manager.plugin.events.on(WSEvents.Project.Created, resetProjects, { filter: null });
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.Project.Deleted, resetProjects, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Created, resetProjects, { filter: null });
		projects = [];
	});

	function resetProjects() {
		projects = [];
		if (type != null) {
			projects.push(...manager.getProjectsByType(type));
		} else {
			projects.push(...manager.getAllProjects());
		}
	}

	function deleteProject(project: WSProject) {
		manager.deleteProject(project);
	}
</script>

<div class="ws-pm-project-list">
	{#if type != null}
		<div class="ws-pm-project-list-header">{PROJECT_TYPE_NAME_PLURAL[type]}</div>
		<div class="ws-pm-project-list-content">
			{#each projects as project}
				<PmProjectListItem {project} {manager} onDelete={deleteProject} />
			{:else}
				<div>No projects.</div>
			{/each}
		</div>
	{:else}
		<div class="ws-pm-project-list-header">All Projects</div>
		<div class="ws-pm-project-list-content">
			{#each projects as project}
				<PmProjectListItem {project} {manager} onDelete={deleteProject} />
			{:else}
				<div>No projects.</div>
			{/each}
		</div>
	{/if}
</div>
