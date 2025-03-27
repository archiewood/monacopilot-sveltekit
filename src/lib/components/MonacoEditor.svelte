<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import loader from '@monaco-editor/loader';
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
  
  export let value = '# Type your code here\n';
  export let language = 'markdown';
  export let theme: 'vs-dark' | 'vs-light' | 'hc-black' = 'vs-dark';
  export let height = '500px';
  import {registerCompletion, type CompletionRegistration} from 'monacopilot';

  
  let container: HTMLElement;
  let editor: Monaco.editor.IStandaloneCodeEditor;
  let monaco: typeof Monaco;
  let completionRegistration: CompletionRegistration | null = null;


  // Create a singleton to persist across hot reloads
  const EditorState = {
    isInitialized: false
  };

  onMount(() => {
    if (!browser) return;
    
    const initEditor = async () => {
      if (EditorState.isInitialized) return;
      
      monaco = await loader.init();
      
      // Initialize editor
      editor = monaco.editor.create(container, {
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

      EditorState.isInitialized = true;

      completionRegistration = registerCompletion(monaco, editor, {
        endpoint: '/api/code-completion',
        language: 'markdown',
      });
    };

    initEditor();
  });

  onDestroy(() => {
    if (editor) {
      editor.dispose();
    }
  });
</script>

{#if browser}
  <div 
    class="w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
    style="height: {height};"
    bind:this={container}
  ></div>
{/if} 