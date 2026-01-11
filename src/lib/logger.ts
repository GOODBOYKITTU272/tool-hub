/**
 * Production Logger Utility
 * - In development: Shows all logs
 * - In production: Only shows errors and warnings
 */

const isDev = import.meta.env.DEV;

export const logger = {
    // Always log errors
    error: (...args: unknown[]) => {
        console.error(...args);
    },

    // Always log warnings
    warn: (...args: unknown[]) => {
        console.warn(...args);
    },

    // Only log info in development
    info: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    // Only log debug in development
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    // Performance logging (only in dev)
    perf: (label: string, fn: () => void) => {
        if (isDev) {
            console.time(label);
            fn();
            console.timeEnd(label);
        } else {
            fn();
        }
    },
};

// Export shorthand for common use
export const log = logger.info;
