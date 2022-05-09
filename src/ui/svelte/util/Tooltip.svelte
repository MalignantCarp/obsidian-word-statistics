<script>
	import { createPopperActions } from "svelte-popperjs";
	const [popperRef, popperContent] = createPopperActions({
		placement: "top",
		strategy: "fixed"
	});

	let showTooltip = false;
</script>

<div class="ws-tooltip-ref" use:popperRef on:mouseenter={() => (showTooltip = true)} on:mouseleave={() => (showTooltip = false)}>
	<slot name="content" />
</div>
{#if showTooltip}
	<div class="ws-tooltip-source tooltip mod-top" role="tooltip" use:popperContent>
		<slot name="tooltip" />
		<div class="tooltip-arrow" data-popper-arrow/>
	</div>
{/if}
