/**
 * User ID Management for localStorage-based user identification
 * Industry standard approach for anonymous services
 */

const USER_ID_KEY = 'ezlunch_user_id';

/**
 * Generate a unique user ID (UUID v4 format)
 */
function generateUserId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get or create user ID from localStorage
 * @returns User ID string
 */
export function getUserId(): string {
    if (typeof window === 'undefined') {
        return 'server-side'; // Fallback for SSR
    }

    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
        userId = generateUserId();
        localStorage.setItem(USER_ID_KEY, userId);
    }

    return userId;
}

/**
 * Clear user ID (for testing purposes)
 */
export function clearUserId(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_ID_KEY);
    }
}
