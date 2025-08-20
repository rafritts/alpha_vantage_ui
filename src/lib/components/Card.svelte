<script lang="ts">
	export let title: string;
	export let description: string;
	export let href: string;
</script>

<a
	{href}
	class="card block rounded-lg border border-gray-200 p-6 no-underline transition-colors duration-200 hover:border-blue-500 hover:text-blue-500"
>
	<h3 class="mb-2 text-xl font-bold tracking-tight">{title} &rarr;</h3>
	<p class="font-normal text-gray-400">{description}</p>
</a>

<style>
	.no-underline {
		text-decoration: none;
	}
</style>
