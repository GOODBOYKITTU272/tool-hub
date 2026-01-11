/**
 * Production Logger - suppresses debug logs in production
 */

const isDev = import.meta.env.DEV;

function error(...args: unknown[]): void {
    console.error(...args);
}

function warn(...args: unknown[]): void {
    console.warn(...args);
}

function info(...args: unknown[]): void {
    if (isDev) console.log(...args);
}

function debug(...args: unknown[]): void {
    if (isDev) console.log(...args);
}

function perf(label: string, fn: () => void): void {
    if (isDev) {
        console.time(label);
        fn();
        console.timeEnd(label);
    } else {
        fn();
    }
}

export const logger = { error, warn, info, debug, perf };
export const log = info;
