<script lang="ts">
	import { setIcon } from "obsidian";
	import { WSEvents } from "src/model/event";
	import type { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSFileProject, WSProject, WSPType } from "src/model/project";
	import { FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import { createPopperActions } from "svelte-popperjs";
	import PmProjectListFileItem from "./PMProjectListFileItem.svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;

	export let onDelete: (project: WSProject) => void;

	let element: HTMLElement;
	let icon: HTMLElement;
	let menuIcon: HTMLElement;
	let editIcon: HTMLElement;
	let deleteIcon: HTMLElement;
	let editMenu: HTMLElement;

	let open = false;
	let showMenu = false;

	let projectWordCount: number = project.totalWords;

	const [menuPopperRef, menuPopperContent] = createPopperActions({
		placement: "bottom-start"
	});

	onMount(() => {
		registerEvents();
		onFileUpdate();
	});

	onDestroy(() => {
		unregisterEvents();
	});

	function registerEvents() {
		manager.plugin.events.on(WSEvents.Project.Renamed, onRenamed, { filter: project, msg: "PMProjectListItem()" });
		manager.plugin.events.on(WSEvents.Project.FilesUpdated, onFileUpdate, { filter: project, msg: "PMProjectListItem()" });
		manager.plugin.events.on(WSEvents.Project.Updated, onProjectUpdate, { filter: project, msg: "PMProjectListItem()" });
	}

	function unregisterEvents() {
		manager.plugin.events.off(WSEvents.Project.Renamed, onRenamed, { filter: project, msg: "PMProjectListItem()" });
		manager.plugin.events.off(WSEvents.Project.FilesUpdated, onFileUpdate, { filter: project, msg: "PMProjectListItem()" });
		manager.plugin.events.off(WSEvents.Project.Updated, onProjectUpdate, { filter: project, msg: "PMProjectListItem()" });
	}

	let invalidState = false;
	let files: WSFile[] = [];

	function onWordCountUpdate() {
		project = project;
		projectWordCount = project.totalWords;
	}

	function onProjectUpdate() {
		if (project instanceof WSFileProject) {
			invalidState = project.file === null;
		}
		if (!invalidState) {
			projectWordCount = project.totalWords;
		}
	}

	function onRenamed() {
		project = project;
	}

	function onFileUpdate() {
		// console.log("onFileUpdate in PMProjectListItem.svelte for project ", project.name);
		project = project;
		files =
			project.type === WSPType.File
				? project.files
				: project.files.sort((a, b) =>
						a.name.localeCompare(b.name, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true })
				  );
		projectWordCount = project.totalWords;
	}

	function openMenu(event: MouseEvent) {
		showMenu = !showMenu;
		event.stopPropagation();
	}

	function onOpen() {
		open = !open;
	}

	function editProject() {
		let modal = manager.modals.createModalFromProject(project);
		modal.open();
	}

	function onConfirm(confirmed: boolean) {
		if (confirmed) {
			onDelete(project);
		}
	}

	function deleteProject() {
		let modal = manager.modals.createConfirmationModal(`Are you sure you want to delete this project, '${project.name}'?`, () => {
			onConfirm(modal.confirmation);
		});
		modal.open();
	}

	$: if (icon) {
		icon.empty();
		setIcon(icon, "right-triangle", 12);
	}

	$: if (menuIcon) {
		menuIcon.empty();
		setIcon(menuIcon, "vertical-three-dots", 12);
	}

	$: if (editIcon) {
		editIcon.empty();
		setIcon(editIcon, "pencil", 12);
	}

	$: if (deleteIcon) {
		deleteIcon.empty();
		setIcon(deleteIcon, "trash", 12);
	}

	function onPageClick(event: MouseEvent) {
		if (showMenu && editMenu && event.target != editMenu && !editMenu.contains(event.target as Node)) {
			showMenu = false;
		}
	}
</script>

<svelte:body on:click={onPageClick} />
<div class="ws-pm-project-list-item" bind:this={element}>
	<div class="ws-pm-project-list-item-header" class:is-open={open}>
		<div class="label" on:click={onOpen}>
			<i class="collapse-icon" class:is-collapsed={!open} bind:this={icon} />
			<div class="ws-pm-project-list-item-name" class:error={invalidState}>{project.name}</div>
		</div>
		<div class="group">
			<div class="ws-pm-project-list-item-word-count" class:hidden={open}>{FormatWords(project.totalWords)}</div>
			<i class="edit-icon" bind:this={editIcon} on:click={editProject} />
			<i class="delete-icon" bind:this={deleteIcon} on:click={deleteProject} />
		</div>
	</div>
	{#if !invalidState}
		<table class="ws-pm-project-list-item-files" class:hidden={!open}>
			<thead>
				<tr class="ws-pm-file-item table-header">
					<th class="ws-pm-file-item-name">File</th>
					<th class="ws-pm-file-item-word-count">Word Count</th>
				</tr>
			</thead>
			<tbody>
				{#each files as file}
					<PmProjectListFileItem {project} {manager} {file} {onWordCountUpdate} />
				{/each}
			</tbody>
			<tfoot>
				<tr class="ws-pm-file-item table-footer">
					<td class="ws-pm-file-item-name">{project.files.length} file{project.files.length != 1 ? "s" : ""}</td>
					<td class="ws-pm-file-item-word-count">{FormatWords(projectWordCount)}</td>
				</tr>
			</tfoot>
		</table>
	{:else}
		<div class="error">Project is missing index.</div>
	{/if}
</div>
