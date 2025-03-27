<script lang="ts">
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
</script>


<MonacoEditor 
value={`# Welcome to Monaco Editor

This is a markdown editor.

You can write markdown here.

It will be rendered in real time.
`}
language="markdown"
theme="vs-light"
/>