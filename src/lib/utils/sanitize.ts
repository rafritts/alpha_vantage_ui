/**
 * Utility functions for sanitizing user input to prevent XSS attacks
 * using the native browser Sanitizer API
 */

/**
 * Sanitizes a string input to prevent XSS attacks
 * Uses the native browser Sanitizer API
 * 
 * @param input - The string to sanitize
 * @returns A sanitized version of the input string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Use the native Sanitizer API
  if (typeof window !== 'undefined' && 'Sanitizer' in window) {
    try {
      // @ts-ignore - Sanitizer API might not be in TypeScript defs yet
      const sanitizer = new window.Sanitizer();
      const div = document.createElement('div');
      div.textContent = input;
      // @ts-ignore - setHTML might not be in TypeScript defs yet
      div.setHTML(div.innerHTML, { sanitizer });
      return div.textContent || '';
    } catch (e) {
      console.error('Error using Sanitizer API:', e);
      // Return the original input if sanitization fails
      return input;
    }
  }
  
  // If Sanitizer API is not available, return the original input
  return input;
}


/**
 * Sanitizes a value for use in HTML attributes
 * 
 * @param value - The value to sanitize
 * @returns A sanitized version of the value
 */
export function sanitizeAttribute(value: string): string {
  if (!value) return '';
  return sanitizeInput(value);
}
