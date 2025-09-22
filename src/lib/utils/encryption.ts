/**
 * Utility functions for secure encryption/decryption of sensitive data
 * Uses crypto-js AES encryption
 */
import CryptoJS from 'crypto-js';

// A constant encryption key for the application
// In a production app, this would ideally be an environment variable
const APP_ENCRYPTION_SECRET = 'alpha-vantage-ui-secure-key-2025';

/**
 * Encrypts a string using AES encryption
 *
 * @param text - The text to encrypt
 * @returns The encrypted text as a string
 */
export function encrypt(text: string): string {
	if (!text) return '';

	try {
		// Encrypt the text using AES
		const encrypted = CryptoJS.AES.encrypt(text, APP_ENCRYPTION_SECRET).toString();
		return encrypted;
	} catch (e) {
		console.error('Error encrypting data:', e);
		return '';
	}
}

/**
 * Decrypts a string that was encrypted with the encrypt function
 *
 * @param encrypted - The encrypted string
 * @returns The decrypted text
 */
export function decrypt(encrypted: string): string {
	if (!encrypted) return '';

	try {
		// Decrypt the text using AES
		const decrypted = CryptoJS.AES.decrypt(encrypted, APP_ENCRYPTION_SECRET);
		return decrypted.toString(CryptoJS.enc.Utf8);
	} catch (e) {
		console.error('Error decrypting data:', e);
		return '';
	}
}
