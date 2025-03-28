<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="container mx-auto p-4">
	{@render children()}
</div>
