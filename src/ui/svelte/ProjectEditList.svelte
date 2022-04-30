<script lang="ts">
	import type { WSProject } from "src/model/project";
	import ProjectListItem from "./ProjectListItem.svelte";

	export let getProjectList: () => WSProject[];
	export let onEdit: (project: WSProject) => void;
	export let onDelete: (project: WSProject) => void;
	let projects: WSProject[] = [];

	export function updateList() {
		projects = getProjectList();
	}
</script>

<div class="ws-project-edit-list">
	{#each projects as project}
		<ProjectListItem {project} {onEdit} {onDelete} />
	{/each}
</div>
