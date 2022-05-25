<script lang="ts">
	import { setIcon } from "obsidian";
	import type { WSProjectManager } from "src/model/manager";
	import { onMount } from "svelte";

	import PmFileInfo from "./PMFileInfo.svelte";
	import ProjectTree from "./ProjectTree.svelte";

	let newProjectButton: HTMLElement;

	export let manager: WSProjectManager;

	onMount(() => {
		setIcon(newProjectButton, "plus-with-circle", 16);
	});

	function onNewProject() {
		let modal = manager.modals.createProjectEditorModal();
		modal.open();
	}
</script>

<div class="ws-project-management-view">
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div class="group">
				<div class="nav-action-button" aria-label="New Project" bind:this={newProjectButton} on:click={onNewProject} />
			</div>
		</div>
	</div>
	<div class="ws-project-management-view-body">
		<ProjectTree {manager} />
	</div>
	<PmFileInfo {manager} defaultFile={manager.plugin.focusFile} />
</div>
