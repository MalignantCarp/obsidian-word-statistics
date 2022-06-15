<script lang="ts">
    export let messages: string[];
</script>
<div class="ws-message-box">
    <ul class="ws-messages">
        {#each messages as message}
            <li>{message}</li>
        {/each}
    </ul>
</div>