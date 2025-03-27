<script lang="ts">
  import { onMount } from 'svelte';
  import * as monaco from 'monaco-editor';
  import loader from '@monaco-editor/loader';
  
  export let value = '// Type your code here\n';
  export let language = 'javascript';
  export let theme: 'vs-dark' | 'vs-light' | 'hc-black' = 'vs-dark';
  export let height = '500px';
  
  let editorContainer: HTMLElement;
  let editor: monaco.editor.IStandaloneCodeEditor;

  onMount(() => {
    // Configure Monaco loader
    loader.config({ monaco });
    
    // Initialize editor
    editor = monaco.editor.create(editorContainer, {
      value,
      language,
      theme,
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      cursorStyle: 'line',
      tabSize: 2,
      insertSpaces: true,
    });

    return () => {
      editor.dispose();
    };
  });
</script>

<div 
  class="w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
  style="height: {height};"
  bind:this={editorContainer}
></div> 