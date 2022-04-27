<script lang="ts">
	import { WSProjectGroup } from "src/model/group";
	import { CanProjectMoveDownInGroup, CanProjectMoveUpInGroup } from "src/model/manager";
	import type { WSProject } from "src/model/project";

	export let project: WSProject;
	export let group: WSProjectGroup = null;
	export let onEdit: (project: WSProject) => void = null;
	export let onDelete: (project: WSProject) => void = null;
	export let onMoveUp: (project: WSProject, group: WSProjectGroup) => void = null;
	export let onMoveDown: (project: WSProject, group: WSProjectGroup) => void = null;
	export let onAdd: (project: WSProject, group: WSProjectGroup) => void = null;
	export let onRemove: (project: WSProject, group: WSProjectGroup) => void = null;

	$: projectName = project.name;
    $: canMoveUp = group instanceof WSProjectGroup ? CanProjectMoveUpInGroup(project, group) : false;
    $: canMoveDown = group instanceof WSProjectGroup ? CanProjectMoveDownInGroup(project, group): false;

	function cb_edit() {
		onEdit(project);
	}

	function cb_delete() {
		onDelete(project);
	}

	function cb_moveUp() {
		onMoveUp(project, group);
	}

	function cb_moveDown() {
		onMoveDown(project, group);
	}

	function cb_add() {
		onAdd(project, group);
	}

	function cb_remove() {
		onRemove(project, group);
	}
</script>

<div class="ws-project-list-item">
	<div class="ws-project-list-item-name">{projectName}</div>
	{#if onEdit}
		<div class="ws-project-list-item-button-edit">
			<button on:click={cb_edit} aria-label="Edit Project">&#x270E;</button>
		</div>
	{/if}
	{#if onDelete}
		<div class="ws-project-list-item-button-delete">
			<button on:click={cb_delete} aria-label="Delete Project">&#x1F5D1;</button>
		</div>
	{/if}
	{#if onMoveUp}
		<div class="ws-project-list-item-button-move-up">
			<button on:click={cb_moveUp} disabled={!canMoveUp} aria-label="Move project up in group">&#x25B2;</button>
		</div>
	{/if}
	{#if onMoveDown}
		<div class="ws-project-list-item-button-move-down">
			<button on:click={cb_moveDown} disabled={!canMoveDown} aria-label="Move project down in group">&#x25BC;</button>
		</div>
	{/if}
	{#if onAdd}
		<div class="ws-project-list-item-button-add">
			<button on:click={cb_add} aria-label="Add project to group">&#x2795;</button>
		</div>
	{/if}
	{#if onRemove}
		<div class="ws-project-list-item-button-remove">
			<button on:click={cb_remove} aria-label="Remove project from group">&#x2796;</button>
		</div>
	{/if}
</div>
