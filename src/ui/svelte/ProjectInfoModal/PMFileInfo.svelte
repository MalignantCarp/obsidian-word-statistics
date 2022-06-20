<script lang="ts">
import { setIcon } from "obsidian";
	import { WSEvents, WSFocusEvent, WSProjectEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";

	export let defaultFile: WSFile;
	export let manager: WSProjectManager;
	let file: WSFile;

	let projects: WSProject[] = [];
	let defaultProjects: WSProject[] = manager.getProjectsByFile(defaultFile);

	let backIcon: HTMLElement;

	onMount(() => {
		registerEvents();
	});

	onDestroy(() => {
		unregisterEvents();
	});

	$: focusFile = file instanceof WSFile ? file : defaultFile;
	$: focusProjects = file instanceof WSFile ? projects : defaultProjects;

	$: if (backIcon) {
		backIcon.empty();
		setIcon(backIcon, "left-arrow-with-tail", 16);
	}


	function registerEvents() {
		manager.plugin.events.on(WSEvents.Focus.File, onFileFocus, null);
		manager.plugin.events.on(WSEvents.Focus.FileItem, onFileItemFocus, null);
		manager.plugin.events.on(WSEvents.Project.FilesUpdated, onProjectFilesUpdated, null);
		manager.plugin.events.on(WSEvents.Project.Deleted, onProjectDeleted, null);
		manager.plugin.events.on(WSEvents.Project.Created, onProjectCreated, null);
	}

	function unregisterEvents() {
		manager.plugin.events.off(WSEvents.Focus.File, onFileFocus, null);
		manager.plugin.events.off(WSEvents.Focus.FileItem, onFileItemFocus, null);
		manager.plugin.events.off(WSEvents.Project.FilesUpdated, onProjectFilesUpdated, null);
		manager.plugin.events.off(WSEvents.Project.Deleted, onProjectDeleted, null);
		manager.plugin.events.off(WSEvents.Project.Created, onProjectCreated, null);
	}

	function onFileFocus(event: WSFocusEvent) {
		defaultFile = event.info.file;
		if (defaultFile instanceof WSFile) {
			defaultProjects = manager.getProjectsByFile(defaultFile);
		} else {
			defaultProjects = [];
		}
	}

	function onFileItemFocus(event: WSFocusEvent) {
		file = event.info.file;
		if (file instanceof WSFile) {
			projects = manager.getProjectsByFile(file);
		} else {
			projects = [];
		}
	}

	function onProjectFilesUpdated(event: WSProjectEvent) {
		if (event.info.project instanceof WSProject) {
			if (defaultProjects.contains(event.info.project)) {
				if (!event.info.project.files.contains(defaultFile)) {
					defaultProjects.remove(event.info.project);
				}
			}
			if (projects.contains(event.info.project)) {
				if (!event.info.project.files.contains(file)) {
					projects.remove(event.info.project);
				}
			}
		}
	}

	function onProjectDeleted(event: WSProjectEvent) {
		if (event.info.project instanceof WSProject) {
			if (defaultProjects.contains(event.info.project)) {
				defaultProjects.remove(event.info.project);
			}
			if (projects.contains(event.info.project)) {
				projects.remove(event.info.project);
			}
		}
	}

	function onProjectCreated(event: WSProjectEvent) {
		if (event.info.project instanceof WSProject) {
			if (event.info.project.files.contains(defaultFile)) {
				defaultProjects.push(event.info.project);
			}
			if (event.info.project.files.contains(file)) {
				projects.push(event.info.project);
			}
		}
	}

	function onClickBack() {
		manager.plugin.events.trigger(new WSFocusEvent({ type: WSEvents.Focus.FileItem, file: null }, { filter: null }));
	}
</script>

<div class="ws-pm-file-info">
	{#if focusFile instanceof WSFile}
		<div class="group">
			<div class="ws-pm-file-info-header">{file instanceof WSFile ? "Selected Project File Info" : "Open File Info"}</div>
			<i class="back-icon" bind:this={backIcon} on:click={onClickBack} aria-label="Back to open file" class:hidden={!(file instanceof WSFile)}>
		</div>
		<table class="ws-file-info" class:hover={file instanceof WSFile}>
			<tr>
				<td>Name</td>
				<td>{focusFile.name}</td>
			</tr>
			<tr>
				<td>Path</td>
				<td>{focusFile.path}</td>
			</tr>
			<tr>
				<td>Title</td>
				<td>{focusFile.title}</td>
			</tr>
			<tr class="ws-pm-fi-project-list">
				<td>{focusProjects.length == 1 ? "Project" : "Projects"}</td>
				<td>
					<ul>
						{#each focusProjects as project}
							<li>{project.id}</li>
						{/each}
					</ul>
				</td>
			</tr>
		</table>
	{:else}
		<div class="error">No file open.</div>
	{/if}
</div>
