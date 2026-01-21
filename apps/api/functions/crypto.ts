/**
 * Token Encryption Utilities
 * Uses AES-GCM for encrypting OAuth tokens before storing in database
 */

/**
 * Encrypts a token using AES-GCM
 * @param token - The plain text token to encrypt
 * @param encryptionKey - The encryption key from environment (TOKEN_ENCRYPTION_KEY)
 * @returns Base64 encoded encrypted token (IV + ciphertext)
 */
export async function encryptToken(token: string, encryptionKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);

    // Derive a 256-bit key from the secret
    const keyMaterial = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an encrypted token
 * @param encryptedData - Base64 encoded encrypted token
 * @param encryptionKey - The encryption key from environment (TOKEN_ENCRYPTION_KEY)
 * @returns The decrypted plain text token
 */
export async function decryptToken(encryptedData: string, encryptionKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // Derive key
    const keyMaterial = encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ciphertext
    );

    return decoder.decode(decrypted);
}

/**
 * Checks if a token is expired
 * @param expiresAt - ISO date string of token expiration
 * @param bufferMinutes - Minutes before expiry to consider as expired (default 5)
 */
export function isTokenExpired(expiresAt: string | null, bufferMinutes: number = 5): boolean {
    if (!expiresAt) return true;

    const expiry = new Date(expiresAt);
    const now = new Date();
    const buffer = bufferMinutes * 60 * 1000; // Convert to milliseconds

    return (expiry.getTime() - buffer) <= now.getTime();
}
