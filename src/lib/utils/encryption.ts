/**
 * Utility functions for basic encryption/decryption of sensitive data
 * This is a simple implementation and provides only basic protection
 */

/**
 * Encrypts a string using a simple XOR cipher with a random salt
 * Note: This is not strong encryption, but provides basic obfuscation
 * 
 * @param text - The text to encrypt
 * @returns The encrypted text as a base64 string with salt
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  // Generate a random salt (8 characters)
  const salt = Array.from(
    { length: 8 },
    () => Math.floor(Math.random() * 36).toString(36)
  ).join('');
  
  // Convert text to array of char codes
  const textChars = text.split('').map(c => c.charCodeAt(0));
  
  // Convert salt to array of char codes and use as key
  const saltChars = salt.split('').map(c => c.charCodeAt(0));
  
  // XOR each character with corresponding salt character (cycling through salt)
  const encryptedChars = textChars.map((char, i) => 
    char ^ saltChars[i % saltChars.length]
  );
  
  // Convert to string and encode as base64
  const encryptedString = String.fromCharCode(...encryptedChars);
  const base64 = btoa(encryptedString);
  
  // Return salt + encrypted data
  return `${salt}:${base64}`;
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 * 
 * @param encrypted - The encrypted string (salt:base64)
 * @returns The decrypted text
 */
export function decrypt(encrypted: string): string {
  if (!encrypted || !encrypted.includes(':')) return '';
  
  try {
    // Split salt and data
    const [salt, base64] = encrypted.split(':');
    
    // Decode base64
    const encryptedString = atob(base64);
    const encryptedChars = encryptedString.split('').map(c => c.charCodeAt(0));
    
    // Convert salt to array of char codes
    const saltChars = salt.split('').map(c => c.charCodeAt(0));
    
    // XOR each character with corresponding salt character (cycling through salt)
    const decryptedChars = encryptedChars.map((char, i) => 
      char ^ saltChars[i % saltChars.length]
    );
    
    // Convert back to string
    return String.fromCharCode(...decryptedChars);
  } catch (e) {
    console.error('Error decrypting data:', e);
    return '';
  }
}
