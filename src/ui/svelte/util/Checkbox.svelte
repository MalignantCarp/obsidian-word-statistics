<script lang="ts">
    export let enabled: boolean;

    export function setEnabled(value: boolean) {
        enabled = value;
    }

    export function getEnabled() {
        return enabled;
    }

    function toggle() {
        enabled = !enabled;
    }
</script>
<div class="checkbox-container" class:is-enabled={enabled} on:click={toggle}></div>