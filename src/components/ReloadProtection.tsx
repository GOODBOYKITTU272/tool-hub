import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setupEmergencyStorageClear } from '@/lib/storageUtils';

/**
 * Component that prevents accidental page reloads when user is logged in
 * - Blocks keyboard shortcuts (F5, Ctrl+R, Cmd+R)
 * - Shows browser warning when attempting to reload via browser button
 * - Provides emergency storage clear (Ctrl+Shift+Alt+C)
 */
export function ReloadProtection() {
    const { currentUser } = useAuth();

    // Always enable emergency storage clear, even when logged out
    useEffect(() => {
        const cleanupEmergencyClear = setupEmergencyStorageClear();
        return cleanupEmergencyClear;
    }, []);

    useEffect(() => {
        // Only enable protection if user is logged in
        if (!currentUser) return;

        // Prevent keyboard shortcuts for refresh
        const preventRefresh = (e: KeyboardEvent) => {
            // F5 key
            if (e.key === 'F5') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+R or Cmd+R (Windows/Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+F5 or Cmd+Shift+R (hard reload)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F5' || e.key === 'r')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };

        // Show warning dialog when user tries to reload or close tab
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const message = 'Are you sure you want to reload? This might cause a problem if you reload. You may need to clear local storage to login again.';

            e.preventDefault();
            e.returnValue = message; // For older browsers
            return message; // For modern browsers
        };

        // Add event listeners
        window.addEventListener('keydown', preventRefresh, true);
        window.addEventListener('beforeunload', handleBeforeUnload);

        console.log('🔒 Reload protection enabled - refresh shortcuts blocked');

        // Cleanup
        return () => {
            window.removeEventListener('keydown', preventRefresh, true);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            console.log('🔓 Reload protection disabled');
        };
    }, [currentUser]);

    return null; // This component doesn't render anything
}
