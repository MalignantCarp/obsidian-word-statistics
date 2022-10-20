<script lang="ts">
	import { setIcon } from "obsidian";
	import type WordStatisticsPlugin from "src/main";
	import {
		WSEvents,
		WSSettingEvent,
		type WSFileEvent,
		type WSFocusEvent,
	} from "src/model/events";
	import { WSFile } from "src/model/file";
	import { WSFolder } from "src/model/folder";
	import { onDestroy, onMount } from "svelte";

	export let plugin: WordStatisticsPlugin;

	let iconV: HTMLElement;
	let iconP: HTMLElement;
	let iconF: HTMLElement;
	let iconR: HTMLElement;

	let fileWords = 0;
	let parentWords = 0;
	let vaultWords = 0;

	let iconSetVault = false;
	let iconSetFile = false;
	let iconSetParent = false;
	let iconSetRecord = false;

	onMount(() => {
		plugin.events.on(WSEvents.Focus.File, updateFileCount, {
			filter: null,
		});
		plugin.events.on(WSEvents.File.WordsChanged, updateFileCount, {
			filter: null,
		});
		plugin.events.on(WSEvents.Setting.Recording, updateView, {
			filter: null,
		});
		plugin.events.on(WSEvents.Setting.StatusBar, updateView, {
			filter: null,
		});
	});

	onDestroy(() => {
		plugin.events.off(WSEvents.Focus.File, updateFileCount, {
			filter: null,
		});
		plugin.events.off(WSEvents.File.WordsChanged, updateFileCount, {
			filter: null,
		});
		plugin.events.on(WSEvents.Setting.Recording, updateView, {
			filter: null,
		});
		plugin.events.on(WSEvents.Setting.StatusBar, updateView, {
			filter: null,
		});
	});

	export function updateVault() {
		vaultWords = plugin.manager?.root?.wordCount;
	}

	export function updateFileCount(event: WSFileEvent | WSFocusEvent) {
		// console.log(event);
		let file = event.info.file;
		if (file !== plugin.focusFile) return; // we only care if this is the file we are focused on
		if (file instanceof WSFile) {
			fileWords = file.wordCount;
			parentWords = file.parent.wordCount;
		} else {
			fileWords = 0;
			parentWords = 0;
		}
		updateVault();
		updateView();
	}

	export function updateView(event?: WSSettingEvent) {
		iconSetVault = plugin.settings.statusbar.showVaultCount;
		iconSetFile = plugin.settings.statusbar.showFileCount;
		iconSetParent = plugin.settings.statusbar.showParentCount;
		iconSetRecord =
			plugin.focusFile instanceof WSFile &&
			plugin.focusFile.parent.isRecording;
	}

	$: if (iconSetVault) {
		if (iconV instanceof HTMLElement) {
			setIcon(iconV, "vault", 16);
		}
	}

	$: if (iconSetFile) {
		if (iconF instanceof HTMLElement) {
			setIcon(iconF, "document", 16);
		}
	}

	$: if (iconSetParent) {
		if (iconP instanceof HTMLElement) {
			setIcon(iconP, "folder", 16);
		}
	}
</script>

<div class="ws-status-bar-container">
	{#if plugin.focusFile instanceof WSFile}
		<div class="ws-status-bar-record">
			<span
				class="record"
				bind:this={iconR}
				class:recording={iconSetRecord}
			/>
		</div>
	{/if}
	{#if iconSetFile && plugin.focusFile instanceof WSFile}
		<div class="ws-status-bar-file">
			<div class="icon" bind:this={iconF} />
			<div class="words">
				{Intl.NumberFormat().format(fileWords) +
					" " +
					(fileWords == 1 ? "word" : "words")}
			</div>
		</div>
	{/if}
	{#if iconSetParent && plugin.focusFile?.parent instanceof WSFolder}
		<div class="ws-status-bar-parent">
			<div class="icon" bind:this={iconP} />
			<div class="words">
				{Intl.NumberFormat().format(parentWords) +
					" " +
					(parentWords == 1 ? "word" : "words")}
			</div>
		</div>
	{/if}
	{#if iconSetVault && plugin.initialScan}
		<div class="ws-status-bar-vault">
			<div class="icon" bind:this={iconV} />
			<div class="words">
				{Intl.NumberFormat().format(vaultWords) +
					" " +
					(vaultWords == 1 ? "word" : "words")}
			</div>
		</div>
	{/if}
</div>
