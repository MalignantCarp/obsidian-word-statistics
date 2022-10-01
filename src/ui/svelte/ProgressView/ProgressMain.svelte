<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import ProgressFocus from "./ProgressFocus.svelte";

	export let manager: WSProjectManager;
</script>

<ProgressFocus {manager} />
