<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import { onMount } from "svelte";
	import SettingItem from "../util/SettingItem.svelte";

	export let path: WSPath;
	export let manager: WSProjectManager;

	export let onClose: () => void;

	let titleEl: HTMLElement;
	let wordGoalPath: HTMLInputElement;
	let wordGoalProjects: HTMLInputElement;
	let wordGoalFiles: HTMLInputElement;
	let titleStr: string;

	onMount(() => {
        if (path._title) {
            titleStr = path._title;
        }
        wordGoalPath.value = path.wordGoalForPath.toString();
        wordGoalProjects.value = path.wordGoalForProjects.toString();
        wordGoalFiles.value = path.wordGoalForFiles.toString();
    });

	function onSave() {
        let newPathGoal = parseInt(wordGoalPath.value) || 0;
        let newProjectGoal = parseInt(wordGoalProjects.value) || 0;
		let newFileGoal = parseInt(wordGoalFiles.value) || 0;
        manager.updatePath(path, titleStr, newPathGoal, newProjectGoal, newFileGoal);
        onClose();
    }

	function onCancel() {
        onClose();
    }
</script>

<div class="ws-path-editor">
	<h2>Customize Path '{path.path}'</h2>
	<SettingItem name="Title" desc={`Please enter your path's title. If left blank, the default will be used ("${path.defaultTitle}")`}>
		<input type="text" bind:this={titleEl} bind:value={titleStr} />
	</SettingItem>
	<SettingItem name="Word Goal For Path" desc={`Choose a goal word count for this path (0 for no goal, max is ${Intl.NumberFormat().format(1000000000)}).`}>
		<input type="number" class="ws-number" min="0" max="1000000000" step="10000" bind:this={wordGoalPath} />
	</SettingItem>
	<SettingItem
		name="Word Goal For Projects"
		desc={`Choose a goal word count for each project in this path (0 for no goal, max is ${Intl.NumberFormat().format(1000000)}).
        <br/><em>A word goal specified in the project will override this goal.</em>`}
	>
		<input type="number" class="ws-number" min="0" max="1000000" step="1000" bind:this={wordGoalProjects} />
	</SettingItem>
	<SettingItem
		name="Word Goal For Files"
		desc={`Choose a goal word count for each file in this project (0 for no goal, max is ${Intl.NumberFormat().format(100000)}).
	<br/><em>A word goal specified in the file or parent project will override this goal.</em>`}
	>
		<input type="number" class="ws-number" min="0" max="100000" step="100" bind:this={wordGoalFiles} />
	</SettingItem>
	<div class="setting-item">
		<div class="setting-item-control">
			<button on:click={onSave}>Save</button>
			<button on:click={onCancel}>Cancel</button>
		</div>
	</div>
</div>
