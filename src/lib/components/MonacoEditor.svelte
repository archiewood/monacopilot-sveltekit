<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import loader from '@monaco-editor/loader';
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
  
  let { 
    value = '# Analytics Report\n\nMonthly sales for March\n',
    language = 'markdown',
    theme = 'vs-dark' as 'vs-dark' | 'vs-light' | 'hc-black',
    height = '500px',
    includeTables = true,
    includeComponents = true,
    debounceDelay = 200,
    model = 'mistral',
    onCompletion
  } = $props<{
    value?: string;
    language?: string;
    theme?: 'vs-dark' | 'vs-light' | 'hc-black';
    height?: string;
    includeTables?: boolean;
    includeComponents?: boolean;
    debounceDelay?: number;
    model?: string;
    onCompletion?: (result: { promise: Promise<{ completion: string | null; timing: { totalServerTime: number; apiTime: number }; metrics: { prefixLength: number; suffixLength: number; completionLength: number; model: string } }> }) => void;
  }>();
  
  let container: HTMLElement;
  let editor: Monaco.editor.IStandaloneCodeEditor;
  let monaco: typeof Monaco;
  let inlineCompletionsDisposable: Monaco.IDisposable | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Create a singleton to persist across hot reloads
  const EditorState = {
    isInitialized: false
  };

  function debounce<T extends [Monaco.Position, string]>(fn: (...args: T) => Promise<string | null>, delay: number) {
    return (...args: T) => {
      return new Promise<string | null>((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fn(...args).then(resolve);
        }, delay);
      });
    };
  }

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
        model
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

  let debouncedGetCompletion = $derived(debounce(getCompletion, debounceDelay));

  onMount(() => {
    if (!browser) return;
    
    const initEditor = async () => {
      if (EditorState.isInitialized) return;
      
      monaco = await loader.init();
      
      // Register inline completions provider
      inlineCompletionsDisposable = monaco.languages.registerInlineCompletionsProvider(language, {
        provideInlineCompletions(model, position, context, token) {
          return new Promise((resolve) => {
            debouncedGetCompletion(position, model.getValue()).then(completion => {
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
    if (debounceTimer) clearTimeout(debounceTimer);
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

