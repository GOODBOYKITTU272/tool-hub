/**
 * Utility functions for managing application storage
 */

/**
 * Clears all ToolHub-related data from localStorage
 * This includes auth session, profile cache, and any other app data
 */
export function clearToolHubStorage() {
    try {
        const keys = Object.keys(localStorage);
        const toolHubKeys = keys.filter(
            key => key.startsWith('tool-hub') ||
                key.startsWith('sb-') || // Supabase keys
                key === 'supabase.auth.token'
        );

        console.log('🧹 Clearing ToolHub storage...', toolHubKeys);

        toolHubKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('✅ ToolHub storage cleared successfully');
        return true;
    } catch (error) {
        console.error('❌ Error clearing storage:', error);
        return false;
    }
}

/**
 * Emergency storage clear via keyboard shortcut
 * Press Ctrl+Shift+Alt+C (or Cmd+Shift+Alt+C on Mac) to clear storage
 */
export function setupEmergencyStorageClear() {
    const handleEmergencyClear = (e: KeyboardEvent) => {
        // Ctrl+Shift+Alt+C or Cmd+Shift+Alt+C
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();

            const confirmed = window.confirm(
                '🚨 EMERGENCY STORAGE CLEAR\n\n' +
                'This will clear all ToolHub data from local storage and reload the page.\n\n' +
                'You will need to login again.\n\n' +
                'Continue?'
            );

            if (confirmed) {
                clearToolHubStorage();
                window.location.reload();
            }
        }
    };

    window.addEventListener('keydown', handleEmergencyClear);

    console.log('🆘 Emergency storage clear enabled: Ctrl+Shift+Alt+C (or Cmd+Shift+Alt+C)');

    return () => {
        window.removeEventListener('keydown', handleEmergencyClear);
    };
}
