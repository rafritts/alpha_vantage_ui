<script lang="ts">
  // Props for customization
  export let href = "/"; // Default to home route
  export let ariaLabel = "Back to card selection";
  export let variant = "primary"; // primary, secondary, accent, etc.
  export let size = "sm"; // sm, md, lg
  export let className = ""; // Additional classes
</script>

<a 
  {href} 
  class="btn btn-{variant} btn-{size} {className.includes('w-full') ? '' : 'btn-circle'}  {className}" 
  aria-label={ariaLabel}
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round" 
    class="feather feather-arrow-left"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
  {#if className.includes('w-full')}
    <span class="ml-2">Back</span>
  {/if}
</a>
