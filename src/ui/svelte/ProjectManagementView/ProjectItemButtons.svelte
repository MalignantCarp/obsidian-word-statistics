<script lang="ts">
	import { setIcon } from "obsidian";

	export let onEdit: () => void;
	export let onDelete: () => void;

	let editIcon: HTMLElement;
	let clearIcon: HTMLElement;

	$: if (editIcon) {
		editIcon.empty();
		setIcon(editIcon, "pencil", 12);
	}

	$: if (clearIcon) {
		clearIcon.empty();
		setIcon(clearIcon, "trash", 12);
	}
</script>

<div class="ws-project-item-buttons">
	<div class="ws-project-item-button ws-icon-edit" on:click={onEdit} aria-label="Edit Project" bind:this={editIcon} />
	<div class="ws-project-item-button ws-icon-delete" on:click={onDelete} aria-label="Delete Project" bind:this={clearIcon} />
</div>
