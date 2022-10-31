<script lang="ts">
	export let name: string;
	export let desc: string;
	export let itemClass: string = null;
	export let infoClass: string = null;
	export let controlClass: string = null;
</script>

<div class={`setting-item${itemClass ? " " + itemClass : ""}`}>
	<div class={`setting-item-info${infoClass ? " " + infoClass : ""}`}>
		<div class="setting-item-name">{name}</div>
		<div class="setting-item-description">{@html desc}</div>
	</div>
	<div class={`setting-item-control${controlClass ? " " + controlClass : ""}`}>
		<slot/>
	</div>
</div>