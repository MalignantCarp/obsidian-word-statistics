<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_INDEX_TYPE, PROJECT_TYPE_DESCRIPTION, PROJECT_TYPE_NAME, WSProject, WSPType } from "src/model/project";
	import { onMount } from "svelte";
	import SuggestBox from "../util/SuggestBox.svelte";
	import ValidatedInput from "../util/ValidatedInput.svelte";

	export let manager: WSProjectManager;
	export let _project: WSProject = null;
	export let type: WSPType;
	export let onClose: () => void;

	let suggestBox: SuggestBox;
	let projectName: ValidatedInput;

	let projectType = PROJECT_TYPE_NAME[type];
	let projectDesc = PROJECT_TYPE_DESCRIPTION[type];

	const options = type === WSPType.File ? manager.collector.getAllPaths() : type === WSPType.Folder ? manager.collector.getAllFolders() : manager.collector.getAllTags();
	const optionPlaceholder = PROJECT_INDEX_TYPE[type];

	$: project = _project instanceof WSProject ? _project : null;

	let title: string;

	onMount(() => {
		title = (project instanceof WSProject ? "Edit " : "New ") + PROJECT_TYPE_NAME[type];
		if (project instanceof WSProject) {
			suggestBox.setInitial(project.index);
			projectName.setText(project.name);
		}
	});

	$: canSave = validName && validIndex;
	let validName: boolean;
	let validIndex: boolean;

	function onSave() {
		manager.projectEditorCallback(type, projectName.getText(), suggestBox.getSelectedOption(), project);
		onClose();
	}

	function onCancel() {
		onClose();
	}

	function validateProjectName(name: string): [boolean, string] {
		if (project instanceof WSProject && project.name == name) {
			return [true, ""];
		}
		return manager.validateProjectName(name);
	}
</script>

<div class="ws-project-editor">
	<h2>{title}</h2>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Project Name</div>
			<div class="setting-item-description">Enter the name of the project here. Project name cannot be blank and must be unique.</div>
		</div>
		<svelte:component this={ValidatedInput} placeholder={"Project Name"} validate={validateProjectName} bind:this={projectName} bind:isValid={validName} />
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{projectType}</div>
			<div class="setting-item-description">{projectDesc}</div>
		</div>
		<svelte:component this={SuggestBox} {options} placeholder={optionPlaceholder} bind:this={suggestBox} bind:isValid={validIndex} />
	</div>
	<div class="setting-item">
		<div class="setting-item-control">
			<button disabled={!canSave} on:click={onSave}>Save</button>
			<button on:click={onCancel}>Cancel</button>
		</div>
	</div>
</div>
