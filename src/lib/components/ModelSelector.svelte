<script lang="ts">
  export let model: string = 'mistral';
  export let onModelChange: (model: string) => void = () => {};

  const models = [
    { id: 'mistral', name: 'Mistral Codestral' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4o', name: 'GPT-4o' }
  ];

  function handleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    model = select.value;
    onModelChange(model);
  }
</script>

<div class="flex items-center">
  <label for="model-select" class="text-sm text-gray-600">Model:</label>
  <select 
    id="model-select" 
    bind:value={model} 
    on:change={handleChange}
    class="ml-2 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
  >
    {#each models as m}
      <option value={m.id}>{m.name}</option>
    {/each}
  </select>
</div>

