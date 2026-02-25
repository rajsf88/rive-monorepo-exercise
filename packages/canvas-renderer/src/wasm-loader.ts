/**
 * WasmLoader — simulates loading a WASM module (mirrors @rive-app/canvas-single WASM bootstrap).
 * In production this would fetch and instantiate the compiled .wasm binary.
 */

export interface WasmModule {
    version: string;
    createRenderer(canvas: HTMLCanvasElement): RiveRenderer;
}

export interface RiveRenderer {
    loadFile(data: ArrayBuffer): Promise<RiveFileHandle>;
    destroy(): void;
}

export interface RiveFileHandle {
    artboardCount: number;
    artboardName(index: number): string;
    animationCount(artboardIndex: number): number;
    animationName(artboardIndex: number, animIndex: number): string;
    stateMachineCount(artboardIndex: number): number;
    stateMachineName(artboardIndex: number, smIndex: number): string;
}

let _moduleCache: WasmModule | null = null;
let _loading: Promise<WasmModule> | null = null;

/**
 * Load (or return cached) WASM module.
 * Accepts an optional wasmUrl; in test environments a mock is injected.
 */
export async function loadWasmModule(
    _wasmUrl?: string,
    _mockModule?: WasmModule
): Promise<WasmModule> {
    if (_mockModule) {
        _moduleCache = _mockModule;
        return _mockModule;
    }

    if (_moduleCache) return _moduleCache;

    if (_loading) return _loading;

    _loading = new Promise<WasmModule>((resolve) => {
        // Simulate async WASM instantiation delay
        setTimeout(() => {
            const mock: WasmModule = {
                version: "0.1.0",
                createRenderer: (canvas: HTMLCanvasElement) => ({
                    loadFile: async (_data: ArrayBuffer): Promise<RiveFileHandle> => ({
                        artboardCount: 1,
                        artboardName: () => "MainArtboard",
                        animationCount: () => 1,
                        animationName: () => "idle",
                        stateMachineCount: () => 1,
                        stateMachineName: () => "MainStateMachine",
                    }),
                    destroy: () => {
                        console.log(`[WasmLoader] Renderer destroyed for canvas: ${canvas.id}`);
                    },
                }),
            };
            _moduleCache = mock;
            resolve(mock);
        }, 0);
    });

    return _loading;
}

/** Reset the module cache (useful in tests) */
export function resetWasmCache(): void {
    _moduleCache = null;
    _loading = null;
}
