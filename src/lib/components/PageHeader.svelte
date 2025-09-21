<script lang="ts">
	import BackButton from './BackButton.svelte';

	export let title: string;
	export let badgeText: string = '';
	export let badgeColor: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' = 'primary';
</script>

<!-- Desktop layout (md and above) -->
<div class="hidden md:flex items-center justify-between w-full">
	<div class="flex items-center gap-3">
		<BackButton variant="primary" size="sm" />
		<h1 class="text-3xl font-bold">{title}</h1>
	</div>
	{#if badgeText}
		<div class="badge badge-{badgeColor} whitespace-nowrap">{badgeText}</div>
	{/if}
</div>

<!-- Mobile layout (below md) -->
<div class="flex md:hidden flex-col w-full gap-3 mb-2">
	<BackButton variant="primary" size="md" className="w-full justify-start" />
	<h1 class="text-2xl font-bold px-1 w-full text-center">{title}</h1>
	{#if badgeText}
		<div class="badge badge-{badgeColor} w-full justify-center py-3 text-sm">{badgeText}</div>
	{/if}
</div>
