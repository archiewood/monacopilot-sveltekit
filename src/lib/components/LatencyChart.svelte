<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  
  const { data = [] } = $props<{
    data: Array<{
      contextSize: number;
      latency: number;
      model: string;
    }>;
  }>();
  
  let chartElement: HTMLElement;
  let chart: echarts.ECharts;
  let currentOptions = $state({});
  let initialized = $state(false);

  // Define colors for different models
  const modelColors: Record<string, string> = {
    'mistral': '#3b82f6', // blue
    'gpt-3.5-turbo': '#10b981', // green
    'gpt-4': '#f59e0b', // yellow
    'gpt-4o': '#ef4444' // red
  };

  // Get unique models from data
  let models = $state<string[]>([]);
  $effect(() => {
    models = Array.from(new Set(data.map((d: { model: string }) => d.model)));
  });
  
  $effect(() => {
    console.log('Effect running, chart:', !!chart, 'data:', data);
    if (chart) {
      const options = {
        title: {
          text: 'Latency vs Context Size',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            return `Model: ${params.seriesName}<br/>Context Size: ${params.value[0]} chars<br/>Latency: ${params.value[1]}ms`;
          }
        },
        legend: {
          data: models,
          top: 30
        },
        grid: {
          left: '55px',
          bottom: '50px',
          right: '20px'
        },
        xAxis: {
          type: 'value',
          name: 'Context Size (chars)',
          nameLocation: 'middle',
          nameGap: 30
        },
        yAxis: {
          type: 'value',
          name: 'Latency (ms)',
          nameLocation: 'middle',
          nameGap: 40
        },
        series: models.map(model => ({
          name: model,
          type: 'scatter',
          data: data
            .filter((d: { model: string }) => d.model === model)
            .map((d: { contextSize: number; latency: number }) => [d.contextSize, d.latency]),
          symbolSize: 8,
          itemStyle: {
            color: modelColors[model] || '#3b82f6'
          }
        }))
      };
      console.log('Setting options:', options);
      currentOptions = options;
      chart.setOption(options);
    }
  });
  
  onMount(() => {
    console.log('Mounting, chartElement:', !!chartElement);
    if (chartElement) {
      chart = echarts.init(chartElement, undefined, {
        renderer: 'canvas'
      });
      console.log('Chart initialized');
      initialized = true;
      
      const handleResize = () => {
        chart?.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        chart?.dispose();
      };
    }
  });
</script>

<div bind:this={chartElement} class="w-full h-[400px] border border-gray-200 p-2"></div>

<!-- <div class="mt-4 p-4 bg-gray-50 rounded-lg">
  <h3 class="text-sm font-mono mb-2">Chart Options:</h3>
  <pre class="text-xs overflow-auto">{JSON.stringify(currentOptions, null, 2)}</pre>
  <div class="mt-2 text-xs text-gray-500">
    Chart initialized: {initialized ? 'Yes' : 'No'}<br>
    Chart exists: {!!chart ? 'Yes' : 'No'}<br>
    Data points: {data.length}
  </div>
</div>  -->