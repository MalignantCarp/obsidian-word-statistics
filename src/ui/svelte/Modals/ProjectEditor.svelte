<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_CATEGORY_NAME, PROJECT_TYPE_DESCRIPTION, PROJECT_INDEX_TYPE, WSProject, WSPType } from "src/model/project";
	import { onMount } from "svelte";
import Checkbox from "../util/Checkbox.svelte";
	import SettingItem from "../util/SettingItem.svelte";
	import SuggestBox from "../util/SuggestBox.svelte";
	import ValidatedInput from "../util/ValidatedInput.svelte";

	export let manager: WSProjectManager;
	export let _project: WSProject = null;
	export let onClose: () => void;

	let pType: WSPType = WSPType.File;

	let projectIndex: SuggestBox;
	let projectID: ValidatedInput;
	let path: SuggestBox;
	let projTitle: HTMLInputElement;

	let categoryEl: HTMLSelectElement;
	let wordGoalFile: HTMLInputElement;
	let wordGoalProject: HTMLInputElement;
	let typeEl: HTMLSelectElement;
	let titleEl: HTMLInputElement;

	$: projectType = PROJECT_INDEX_TYPE[pType];
	$: projectDesc = PROJECT_TYPE_DESCRIPTION[pType];

	const options: string[][] = [manager.collector.getAllPaths(), manager.collector.getAllFolders(), manager.collector.getAllTags()];

	$: optionPlaceholder = PROJECT_INDEX_TYPE[pType];
	$: project = _project instanceof WSProject ? _project : null;

	let title: string;
	let titleStr: string;

	onMount(() => {
		title = (project instanceof WSProject ? "Edit " : "New ") + "Project";
		if (project instanceof WSProject) {
			projectIndex.setInitial(project.index);
			pType = project.pType;
			projectID.setText(project.id);
			titleStr = project._title;
			path.setInitial(project.path);
			categoryEl.selectedIndex = project.category;
			wordGoalProject.value = project.wordGoalForProject.toString();
			wordGoalFile.value = project.wordGoalForFiles.toString();
			monitoredWC = project.monitorCounts;
			monitorCheck.setEnabled(monitoredWC);
		}
	});

	$: canSave = validID && validIndex && validPath;
	let validID: boolean;
	let validIndex: boolean;
	let validPath: boolean;

	let monitoredWC: boolean;
	let monitorCheck: Checkbox;

	function onSave() {
		if (_project === null) {
			manager.createProject(
				pType,
				projectID.getText(),
				path.getSearchString(),
				projectIndex.getSelectedOption(),
				categoryEl.selectedIndex,
				titleStr,
				parseInt(wordGoalProject.value) || 0,
				parseInt(wordGoalFile.value) || 0,
				monitorCheck.getEnabled()
			);
		} else {
			manager.setProjectPath(_project, path.getSearchString());
			manager.setProjectID(_project, projectID.getText());
			manager.setProjectIndex(_project, projectIndex.getSelectedOption());
			manager.setProjectCategory(_project, categoryEl.selectedIndex);
			manager.setProjectTitle(_project, titleStr);
			let newGoal = parseInt(wordGoalProject.value) || 0;
			let newFileGoal = parseInt(wordGoalFile.value) || 0;
			manager.setProjectGoals(_project, newGoal, newFileGoal);
			manager.setProjectMonitored(_project, monitorCheck.getEnabled());
		}
		onClose();
	}

	function onCancel() {
		onClose();
	}

	function onTypeChange() {
		if (_project instanceof WSProject) {
			console.log("Attempted to change type of existing project.");
			return;
		}
		let newType = typeEl.selectedIndex;
		if (newType != pType) {
			pType = newType;
			// do we need to go projectIndex = projectIndex or ;?
			projectIndex.resetOptions(options[pType]);
		}
	}

	function validateProjectID(id: string): [boolean, string] {
		if (project instanceof WSProject && project.id === id) {
			return [true, ""];
		}
		return manager.validateProjectID(id);
	}

	function validateProjectPath(path: string): [boolean, string] {
		if (project instanceof WSProject && project.path === path) {
			return [true, ""];
		}
		return manager.validatePath(path);
	}

	function getPathStrings() {
		let strings = manager.getPathStrings();
		strings.remove("");
		return strings;
	}
</script>

<div class="ws-project-editor">
	<h2>{title}</h2>
	<SettingItem
		name="Project Type"
		desc="Select the type of project you wish to use. <em>File Index</em> projects are indexed by Markdown file, <em>Folder</em> projects are indexed by a
		file path, and <em>Tag</em> projects are indexed by tag. Once a project has been created, its type cannot be changed."
	>
		<select class="ws-project-editor-project-type dropdown" disabled={_project instanceof WSProject} bind:this={typeEl} on:change={onTypeChange}>
			{#each PROJECT_INDEX_TYPE as piType, i}
				<option value={i} selected={i === pType}>{piType}</option>
			{/each}
		</select>
	</SettingItem>
	<SettingItem
		name="Project ID"
		desc="Enter the ID of the project here. The project ID cannot be blank and must be unique. The Project ID will be used in sorting and may be
	overridden (visually) by the project's title."
		controlClass="ws-validated-input"
	>
		<svelte:component this={ValidatedInput} placeholder={"Project ID"} validate={validateProjectID} bind:this={projectID} bind:isValid={validID} />
	</SettingItem>
	<SettingItem
		name="Project Path"
		desc="Enter the path for this project. The project path allows you to organize the hierarchy of your projects. It can be blank (root path), cannot
	begin or end with a forward-slash (/) or space, and can be as deep as you want, with each level separated by a forward-slash (/).
	<br />Example: 'Book Series/Book 1'"
		controlClass="ws-suggest-box"
	>
		<svelte:component
			this={SuggestBox}
			options={getPathStrings()}
			placeholder={""}
			bind:this={path}
			bind:isValid={validPath}
			customValidation={validateProjectPath}
		/>
	</SettingItem>
	<SettingItem name={projectType} desc={projectDesc} controlClass="ws-suggest-box">
		<svelte:component this={SuggestBox} options={options[pType]} placeholder={optionPlaceholder} bind:this={projectIndex} bind:isValid={validIndex} />
	</SettingItem>
	<SettingItem name="Category" desc="Choose a category for this project. Defaults to None.">
		<select class="ws-project-editor-project-category dropdown" bind:this={categoryEl}>
			{#each PROJECT_CATEGORY_NAME as category, i}
				<option value={i} selected={i === 0}>{category}</option>
			{/each}
		</select>
	</SettingItem>
	<SettingItem name="Title" desc="Please enter your project title. If left blank, project ID will be displayed in its place.">
		<input type="text" bind:this={titleEl} bind:value={titleStr} />
	</SettingItem>
	<SettingItem
		name="Word Goal For Project"
		desc={`Choose a goal word count for this project (0 for no goal, max is ${Intl.NumberFormat().format(1000000000)}).`}
	>
		<input type="number" class="ws-number" min="0" max="1000000000" step="1000" bind:this={wordGoalProject} />
	</SettingItem>
	<SettingItem
		name="Word Goal For Files"
		desc={`Choose a goal word count for each file in this project (0 for no goal, max is ${Intl.NumberFormat().format(1000000)}).
	<br/><em>A word goal specified in the file will override this goal.</em>`}
	>
		<input type="number" class="ws-number" min="0" max="1000000" step="100" bind:this={wordGoalFile} />
	</SettingItem>
	<SettingItem
		name="Monitor Word Counts"
		desc={`Record word counts for this project if Record Statistics option is set to Monitored Projects Only. Otherwise, this option has no effect.`}
	>
		<Checkbox enabled={monitoredWC} bind:this={monitorCheck}/>
	</SettingItem>
	<div class="setting-item">
		<div class="setting-item-control">
			<button disabled={!canSave} on:click={onSave}>Save</button>
			<button on:click={onCancel}>Cancel</button>
		</div>
	</div>
</div>
