<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';
  
  const { data = [] } = $props<{
    data: Array<{
      contextSize: number;
      latency: number;
    }>;
  }>();
  
  let chartElement: HTMLElement;
  let chart: echarts.ECharts;
  let currentOptions = $state({});
  let initialized = $state(false);
  
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
            return `Context Size: ${params.value[0]} chars<br/>Latency: ${params.value[1]}ms`;
          }
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
        series: [{
          type: 'scatter',
          data: data.map((d: { contextSize: number; latency: number }) => [d.contextSize, d.latency]),
          symbolSize: 8,
          itemStyle: {
            color: '#3b82f6'
          }
        }]
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

<div bind:this={chartElement} class="w-full h-[400px] bg-white rounded-lg shadow-sm"></div>

<!-- <div class="mt-4 p-4 bg-gray-50 rounded-lg">
  <h3 class="text-sm font-mono mb-2">Chart Options:</h3>
  <pre class="text-xs overflow-auto">{JSON.stringify(currentOptions, null, 2)}</pre>
  <div class="mt-2 text-xs text-gray-500">
    Chart initialized: {initialized ? 'Yes' : 'No'}<br>
    Chart exists: {!!chart ? 'Yes' : 'No'}<br>
    Data points: {data.length}
  </div>
</div>  -->