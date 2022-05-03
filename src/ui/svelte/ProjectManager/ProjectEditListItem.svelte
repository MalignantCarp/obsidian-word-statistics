<script lang="ts">
	import { setIcon } from "obsidian";
	import type { WSProject } from "src/model/project";
	import { onMount } from "svelte";

	export let project: WSProject;
	export let onEdit: (project: WSProject) => void = null;
	export let onDelete: (project: WSProject) => void = null;

	let editButton: HTMLElement;
	let deleteButton: HTMLElement;

	onMount(() => {
		setIcon(editButton, "pencil", 16);
		setIcon(deleteButton, "trash", 16);
	});

	$: projectName = project.name;

	function cb_edit() {
		onEdit(project);
	}

	function cb_delete() {
		onDelete(project);
	}
</script>

<div class="ws-project-edit-list-item setting-item">
	<div class="setting-item-name">{projectName}</div>
	<div class="setting-item-control">
		<div class="setting-editor-extra-setting-button clickable-icon" bind:this={editButton} on:click={cb_edit} />
		<div class="setting-editor-extra-setting-button clickable-icon" bind:this={deleteButton} on:click={cb_delete} />
	</div>
</div>
