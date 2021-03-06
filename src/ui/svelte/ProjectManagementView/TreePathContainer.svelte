<script lang="ts">
	import { WSEvents, WSPathEvent, WSProjectEvent } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { GetProgressGrade } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import PathItemButtons from "./PathItemButtons.svelte";
	import PathWordCount from "./PathWordCount.svelte";
	import TreePathLabel from "./TreePathLabel.svelte";
	import TreeProjectContainer from "./TreeProjectContainer.svelte";

	export let manager: WSProjectManager;
	export let path: WSPath;

	export let onDeletePath: (path: WSPath) => void;

	let childPaths: WSPath[] = [];
	let childProjects: WSProject[] = [];

	let buttons: PathItemButtons;
	let label: TreePathLabel;

	let collapsed = false;

	let progress: HTMLElement;
	let progressData: string;

	onMount(() => {
		// console.log(`Creating UI for path (${path.path}/) === root = ${path === manager.pathRoot} with ${childPaths.length} children`);
		manager.plugin.events.on(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Cleared, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Set, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Updated, updateChildren, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Created, updateChildren, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Deleted, updateChildren, { filter: null });
		manager.plugin.events.on(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.on(WSEvents.Project.Deleted, updateProjects, { filter: null });
		childPaths = path.getChildren();
		childProjects = manager.getProjectsByExactPath(path.path);
		buttons.reset();
		label.reset();
	});

	onDestroy(() => {
		// console.log("Call to destroy path container for ", path.path)
		manager.plugin.events.off(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Cleared, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Set, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Updated, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Created, updateChildren, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Deleted, updateChildren, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Deleted, updateProjects, { filter: null });
	});

	function reset(event: WSPathEvent) {
		// console.log("reset() ", event.info.type, path.path, ">>", event.info.path.path, path.hasChild(event.info.path))
		buttons.reset();
		label.reset();
	}

	function updateProjects(event: WSProjectEvent) {
		// we only need to update our projects if this project is a direct children
		if (event.info.project.path === path.path) {
			childProjects = manager.getProjectsByExactPath(path.path);
			buttons.reset();
			label.reset();
		}
	}

	function updateChildren(event: WSPathEvent) {
		// console.log(`updateChildren(${path.path}, ${event.info.type}, ${event.info.path.path}) = ${path === event.info.path || path.hasChild(event.info.path) || (event.info.type === WSEvents.Path.Deleted && path === event.info.data[0])}`);
		// we only need to update our path children if the created or deleted path is a direct child, or if the path is the self
		if (path === event.info.path || path.hasChild(event.info.path) || (event.info.type === WSEvents.Path.Deleted && path === event.info.data[0])) {
			childPaths = path.getChildren();
			// console.log(path, childPaths);
			reset(event);
		}
	}

	function editPath() {
		let modal = manager.modals.createPathEditorModal(path);
		modal.open();
	}

	function onConfirmDelete(confirmed: boolean) {
		if (confirmed) {
			onDeletePath(path);
		}
	}

	function onConfirmClear(confirmed: boolean) {
		if (confirmed) {
			manager.resetPath(path);
		}
	}

	function onConfirmDeleteProject(confirmed: boolean, project: WSProject) {
		if (confirmed) {
			manager.deleteProject(project);
		}
	}

	function pathDelete() {
		let modal = manager.modals.createConfirmationModal(
			`Are you sure you want to purge this path ('/${path.title}/')?`,
			() => {
				onConfirmDelete(modal.confirmation);
			},
			"Purge"
		);
		modal.open();
	}

	function pathClear() {
		let modal = manager.modals.createConfirmationModal(
			`Are you sure you want to reset this path ('/${path.title}/') to defaults?`,
			() => {
				onConfirmClear(modal.confirmation);
			},
			"Reset"
		);
		modal.open();
	}

	function deleteProject(project: WSProject) {
		let modal = manager.modals.createConfirmationModal(`Are you sure you want to delete this project ('${project.id}')?`, () => {
			onConfirmDeleteProject(modal.confirmation, project);
		});
		modal.open();
	}

	function collapseToggle() {
		collapsed = !collapsed;
	}

	function onWordCountUpdate(count: number) {
		if (progress) {
			let goal = manager.getWordGoalForPath(path);
			if (goal > 0) {
				let percent = Math.round((count / goal) * 100);
				percent = percent > 100 ? 100 : percent < 0 ? 0 : percent;
				progressData = GetProgressGrade(percent);
				progress.style.width = percent.toString() + "%";
			} else {
				progressData = "0";
				progress.style.width = "0";
			}
		} else {
			console.log("Tried to update progress bars, but progress bar is ", progress);
		}
	}
</script>

<div class="ws-path-item tree-item" class:is-collapsed={collapsed}>
	<div class="ws-path-item-self tree-item-self" class:is-clickable={path != manager.pathRoot}>
		<TreePathLabel bind:this={label} {manager} {path} {collapseToggle} />
		<div class="ws-path-item-end">
			<PathWordCount {path} {manager} {onWordCountUpdate} />
			<PathItemButtons bind:this={buttons} {manager} {path} {editPath} {pathClear} {pathDelete} />
		</div>
	</div>
	<div class="ws-word-progress" data-progress={progressData} bind:this={progress} />
	{#if !collapsed && (path.hasChildren() || path.hasProjects(manager))}
		<div class="ws-path-item-children tree-item-children">
			{#each childPaths as childPath}
				<svelte:self {manager} path={childPath} {onDeletePath} />
			{/each}
			{#each childProjects as childProject}
				<TreeProjectContainer {manager} project={childProject} {deleteProject} />
			{/each}
		</div>
	{/if}
</div>
