<script lang="ts">
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import LatencyChart from '$lib/components/LatencyChart.svelte';
  let includeTables = $state(true);
  let includeComponents = $state(true);
  
  let lastRequestTiming: {
    totalTime: number;
    serverTime: number;
    mistralApiTime: number;
    metrics: {
      prefixLength: number;
      suffixLength: number;
      completionLength: number;
    };
  } | null = $state(null);
  
  let requestHistory = $state<Array<{
    totalTime: number;
    serverTime: number;
    mistralApiTime: number;
    metrics: {
      prefixLength: number;
      suffixLength: number;
      completionLength: number;
    };
    timestamp: Date;
  }>>([]);

  let chartData = $derived(requestHistory.map(request => ({
    contextSize: request.metrics.prefixLength + request.metrics.suffixLength,
    latency: request.totalTime
  })));

  function handleCompletion(event: { promise: Promise<{ completion: string | null; timing: { totalServerTime: number; mistralApiTime: number }; metrics: { prefixLength: number; suffixLength: number; completionLength: number } }> }) {
    const requestStart = Date.now();
    console.log('🚀 Starting completion request from client...');
    
    event.promise.then((result) => {
      const totalTime = Date.now() - requestStart;
      console.log('📊 Timing breakdown:');
      console.table({
        'Total round-trip time': `${totalTime}ms`,
        'Server processing time': `${result.timing.totalServerTime}ms`,
        'Mistral API time': `${result.timing.mistralApiTime}ms`,
        'Network overhead': `${totalTime - result.timing.totalServerTime}ms`
      });
      
      lastRequestTiming = {
        totalTime,
        serverTime: result.timing.totalServerTime,
        mistralApiTime: result.timing.mistralApiTime,
        metrics: result.metrics
      };

      // Add to history, keeping only last 10
      requestHistory = [
        ...requestHistory,
        {
          totalTime,
          serverTime: result.timing.totalServerTime,
          mistralApiTime: result.timing.mistralApiTime,
          metrics: result.metrics,
          timestamp: new Date()
        }
      ];
    }).catch((error) => {
      console.error('❌ Completion request failed:', error);
      console.log(`⚠️ Failed after ${Date.now() - requestStart}ms`);
    });
  }
</script>

<h1 class="text-2xl font-bold mb-4">Monaco + Mistral Completion</h1>

<div class="m-4">
  <div class="flex flex-col gap-4">
    <label class="flex items-center cursor-pointer">
      <input type="checkbox" bind:checked={includeTables} class="sr-only peer">
      <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      <span class="ml-2 text-sm text-gray-600">Tables Context</span>
    </label>
    <label class="flex items-center cursor-pointer">
      <input type="checkbox" bind:checked={includeComponents} class="sr-only peer">
      <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      <span class="ml-2 text-sm text-gray-600">Components Context</span>
    </label>
  </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <MonacoEditor 
    language="markdown"
    theme="vs-light"
    height="400px"
    {includeTables}
    {includeComponents}
    onCompletion={handleCompletion}
  />
  
  <LatencyChart data={chartData} />
</div>

{#if requestHistory.length > 0}
  <div class="mt-4 p-4 bg-gray-50 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">Last 10 Requests</h3>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Time</th>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Total (ms)</th>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Server (ms)</th>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Mistral (ms)</th>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Network (ms)</th>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Context (chars)</th>
            <th class="p-2 text-left border-b border-gray-200 bg-gray-100">Completion (chars)</th>
          </tr>
        </thead>
        <tbody>
          {#each requestHistory as request}
            <tr class="hover:bg-gray-50">
              <td class="p-2 border-b border-gray-200">{request.timestamp.toLocaleTimeString()}</td>
              <td class="p-2 border-b border-gray-200">{request.totalTime}</td>
              <td class="p-2 border-b border-gray-200">{request.serverTime}</td>
              <td class="p-2 border-b border-gray-200">{request.mistralApiTime}</td>
              <td class="p-2 border-b border-gray-200">{request.totalTime - request.serverTime}</td>
              <td class="p-2 border-b border-gray-200">{request.metrics.prefixLength + request.metrics.suffixLength}</td>
              <td class="p-2 border-b border-gray-200">{request.metrics.completionLength}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}