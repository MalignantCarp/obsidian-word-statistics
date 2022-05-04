<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
import { onMount } from "svelte";
	import ProjectEditListItem from "./ProjectEditListItem.svelte";

	export let manager: WSProjectManager;
	export let getProjectList: () => WSProject[];
	let projects: WSProject[] = [];

	function updateProjects() {
		projects = getProjectList();
	}

	function onEdit(project: WSProject) {
		let modal = manager.modals.createModalFromProject(project);
		modal.open();
	}

	function onDelete(project: WSProject) {
		manager.deleteProject(project);
		updateProjects();
	}

	onMount(() => {
		updateProjects();
	});
</script>

<div class="ws-project-edit-list">
	{#each projects as project (project.name)}
		<ProjectEditListItem {project} {onEdit} {onDelete}/>
	{/each}
</div>
