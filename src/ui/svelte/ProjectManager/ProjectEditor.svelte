<script lang="ts">
import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_INDEX_TYPE, PROJECT_TYPE_DESCRIPTION, PROJECT_TYPE_NAME, WSProject, WSPType } from "src/model/project";
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

	let title = (project instanceof WSProject ? "Edit " : "New ") + PROJECT_TYPE_NAME[type];
    let placeholder = project instanceof WSProject ? project.name : "Project Name"

	$: canSave = suggestBox.getSelectedOption() != null && projectName.isValidated();

	function onSave() {
        manager.projectEditorCallback(type, projectName.getText(), suggestBox.getSelectedOption());
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

<h2>{title}</h2>
<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">Project Name</div>
		<div class="setting-item-description">Enter the name of the project here. Project name cannot be blank and must be unique.</div>
	</div>
	<ValidatedInput placeholder={placeholder} validate={validateProjectName} bind:this={projectName} />
</div>
<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{projectType}</div>
		<div class="setting-item-description">{projectDesc}</div>
	</div>
	<SuggestBox {options} placeholder={optionPlaceholder} bind:this={suggestBox} />
</div>
<div class="setting-item">
	<div class="setting-item-control">
		<button disabled={!canSave} on:click={onSave}>Save</button>
		<button on:click={onCancel}>Cancel</button>
	</div>
</div>
