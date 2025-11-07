export interface FiltersConfigurationGate {
    promise: Promise<void>;
    resolve: () => void;
    defer: () => void;
    isResolved: () => boolean;
}

function createFiltersConfigurationGate(): FiltersConfigurationGate {
    let resolved = false;
    let autoResolveHandle: number | undefined;
    let resolvePromise!: () => void;

    const promise = new Promise<void>(resolve => {
        resolvePromise = () => {
            if (resolved) {
                return;
            }

            resolved = true;
            resolve();
        };
    });

    const clearAutoResolve = () => {
        if (autoResolveHandle !== undefined) {
            clearTimeout(autoResolveHandle);
            autoResolveHandle = undefined;
        }
    };

    const gate: FiltersConfigurationGate = {
        promise,
        resolve: () => {
            clearAutoResolve();
            resolvePromise();
        },
        defer: () => {
            clearAutoResolve();
        },
        isResolved: () => resolved,
    };

    autoResolveHandle = window.setTimeout(() => {
        gate.resolve();
    }, 0);

    return gate;
}

export function initializeFiltersConfigurationGate(): FiltersConfigurationGate {
    const gate = createFiltersConfigurationGate();
    window.relewiseUIFiltersGate = gate;
    return gate;
}

export function getFiltersConfigurationGate(): FiltersConfigurationGate {
    if (!window.relewiseUIFiltersGate) {
        return initializeFiltersConfigurationGate();
    }

    return window.relewiseUIFiltersGate;
}

export function deferFiltersConfiguration(): void {
    getFiltersConfigurationGate().defer();
}

export function waitForFiltersConfiguration(): Promise<void> {
    return getFiltersConfigurationGate().promise;
}

export function resolveFiltersConfiguration(): void {
    getFiltersConfigurationGate().resolve();
}

declare global {
    interface Window {
        relewiseUIFiltersGate?: FiltersConfigurationGate;
    }
}
