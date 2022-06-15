<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
import { GetProgressGrade } from "src/util";
	import ProjectItemButtons from "./ProjectItemButtons.svelte";
	import ProjectWordCount from "./ProjectWordCount.svelte";
	import TreeProjectLabel from "./TreeProjectLabel.svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;

	let progress: HTMLElement;
	let progressData: string;

	export let deleteProject: (project: WSProject) => void;

	function onEdit() {
		let modal = manager.modals.createProjectEditorModal(project);
		modal.open();
	}

	function onDelete() {
		deleteProject(project);
	}

	function onWordCountUpdate(count: number) {
		let goal = manager.getWordGoalForProjectByContext(project);
		if (goal) {
			let percent = Math.round((count / goal) * 100);
			percent = percent > 100 ? 100 : percent < 0 ? 0 : percent;
			progressData = GetProgressGrade(percent);
			progress.style.width = percent.toString() + "%";
		} else {
            progressData = "0";
			progress.style.width = "0";
		}
	}
</script>

<div class="ws-project-item tree-item">
	<div class="ws-project-item-self tree-item-self is-clickable">
		<TreeProjectLabel {manager} {project} />
		<div class="ws-project-item-end">
			<ProjectWordCount {project} {manager} {onWordCountUpdate} />
			<ProjectItemButtons {onEdit} {onDelete} />
		</div>
	</div>
	<div class="ws-word-progress" data-progress={progressData} bind:this={progress} />
</div>
