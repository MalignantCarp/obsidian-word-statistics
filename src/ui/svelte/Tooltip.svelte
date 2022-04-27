<script lang="ts">
	export let bottom = false;

	let x: number;
	let y: number;
	let mouseOver = false;
	let clientHeight: number;

	function onMouseOver(event: MouseEvent) {
		mouseOver = true;
		x = event.clientX - 5;
		y = event.clientY - (bottom ? clientHeight : -clientHeight) - 10;
	}

	function onMouseMove(event: MouseEvent) {
		x = event.clientX - 5;
		y = event.clientY - (bottom ? clientHeight : -clientHeight) - 10;
	}

	function onMouseLeave(event?: MouseEvent) {
		mouseOver = false;
	}

	function onFocus(event: FocusEvent) {}

	function onBlur(event: FocusEvent) {}
</script>

<div on:mouseover={onMouseOver} on:focus={onFocus} on:mouseleave={onMouseLeave} on:mousemove={onMouseMove} on:blur={onBlur}>
	<slot name="content" />
</div>

{#if mouseOver && $$slots.tooltip}
	<div bind:clientHeight style="top: {y}px; left: {x}px;" class="tooltip"><slot name="tooltip" /></div>
{/if}
