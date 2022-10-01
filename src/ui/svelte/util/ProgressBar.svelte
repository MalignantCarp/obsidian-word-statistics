<script lang="ts">

    let progressData: string = "0";
    let style: string = "";
    let label: string = "";

    export function SetProgress(prog: number) {
        label = prog >= 0 ? prog.toFixed(2) + "%" : "";
        prog = Math.max(0, prog);
        prog = Math.min(100, prog);
        progressData = (prog/10).toFixed(0);
        style = "width: calc(" + (prog*0.98).toFixed(0) + "% - var(--padding));";
    }

</script>
<div class="ws-progress">
    <div class="ws-progress-bar" data-progress={progressData} style={style}/>
    <div class="ws-progress-bar-label">{label}</div>
</div>