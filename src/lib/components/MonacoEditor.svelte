<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import loader from '@monaco-editor/loader';
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
  
  let { 
    value = '# Type your code here\n',
    language = 'markdown',
    theme = 'vs-dark' as 'vs-dark' | 'vs-light' | 'hc-black',
    height = '500px',
    includeTables = true,
    includeComponents = true,
    onCompletion
  } = $props<{
    value?: string;
    language?: string;
    theme?: 'vs-dark' | 'vs-light' | 'hc-black';
    height?: string;
    includeTables?: boolean;
    includeComponents?: boolean;
    onCompletion?: (result: { promise: Promise<{ completion: string | null; timing: { totalServerTime: number; mistralApiTime: number }; metrics: { prefixLength: number; suffixLength: number; completionLength: number } }> }) => void;
  }>();
  
  let container: HTMLElement;
  let editor: Monaco.editor.IStandaloneCodeEditor;
  let monaco: typeof Monaco;
  let inlineCompletionsDisposable: Monaco.IDisposable | null = null;

  // Create a singleton to persist across hot reloads
  const EditorState = {
    isInitialized: false
  };

  async function getCompletion(position: Monaco.Position, text: string): Promise<string | null> {
    const requestPromise = fetch('/api/code-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        position: {
          lineNumber: position.lineNumber,
          column: position.column,
        },
        text,
        includeTables,
        includeComponents,
      }),
    }).then(r => r.json());

    // Call the completion callback if provided
    onCompletion?.({ promise: requestPromise });

    try {
      const data = await requestPromise;
      return data.completion || null;
    } catch (error) {
      console.error('Error getting completion:', error);
      return null;
    }
  }

  onMount(() => {
    if (!browser) return;
    
    const initEditor = async () => {
      if (EditorState.isInitialized) return;
      
      monaco = await loader.init();
      
      // Register inline completions provider
      inlineCompletionsDisposable = monaco.languages.registerInlineCompletionsProvider(language, {
        provideInlineCompletions(model, position, context, token) {
          return new Promise((resolve) => {
            getCompletion(position, model.getValue()).then(completion => {
              if (!completion) {
                resolve({ items: [] });
                return;
              }

              resolve({
                items: [{
                  insertText: completion,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                  command: undefined
                }]
              });
            });
          });
        },
        freeInlineCompletions() {}
      });
      
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
        inlineSuggest: {
          enabled: true,
          mode: 'subword'
        }
      });

      EditorState.isInitialized = true;
    };

    initEditor();
  });

  onDestroy(() => {
    if (inlineCompletionsDisposable) {
      inlineCompletionsDisposable.dispose();
    }
    if (editor) {
      editor.dispose();
    }
  });
</script>

<div 
  class="w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
  style="height: {height};"
  bind:this={container}
></div>

