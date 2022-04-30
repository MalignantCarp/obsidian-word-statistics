<script lang="ts">
	import type { WSProject } from "src/model/project";
	import ProjectEditList from "./ProjectEditList.svelte";

	export let title: string;
	export let name: string;
	export let description: string;
	export let buttonLabel: string;

	export let onClick: () => void;
	export let getProjectList: () => WSProject[];
	export let onEdit: (project: WSProject) => void;
	export let onDelete: (project: WSProject) => void;
</script>

<div class="ws-project-edit-panel">
	<h1>{title}</h1>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{name}</div>
			<div class="setting-item-description">{description}</div>
		</div>
		<div class="setting-item-control">
			<button on:click={onClick}>{buttonLabel}</button>
		</div>
	</div>
	<div class="setting-item">
		<ProjectEditList {getProjectList} {onEdit} {onDelete} />
	</div>
</div>
