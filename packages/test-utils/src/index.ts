import { Loop, Fit, Alignment, StateMachineInputType, RiveEventType } from "@rive-monorepo/core";

/**
 * Mock factories for creating Rive test fixtures.
 * Import these in any package test to get consistent mocks without needing
 * to import from canvas-renderer (to avoid circular DTS issues).
 */

// Inline the minimal types needed for mocking to avoid cross-package DTS issues
export interface MockFileHandle {
    artboardCount: number;
    artboardName(index: number): string;
    animationCount(artboardIndex: number): number;
    animationName(artboardIndex: number, animIndex: number): string;
    stateMachineCount(artboardIndex: number): number;
    stateMachineName(artboardIndex: number, smIndex: number): string;
}

export interface MockRenderer {
    loadFile(data: ArrayBuffer): Promise<MockFileHandle>;
    destroy(): void;
}

export interface MockWasmModule {
    version: string;
    createRenderer(canvas: HTMLCanvasElement): MockRenderer;
}

export function createMockFileHandle(overrides?: Partial<MockFileHandle>): MockFileHandle {
    return {
        artboardCount: 1,
        artboardName: () => "MainArtboard",
        animationCount: () => 2,
        animationName: (_ai: number, i: number) => (i === 0 ? "idle" : "walk"),
        stateMachineCount: () => 1,
        stateMachineName: () => "MainStateMachine",
        ...overrides,
    };
}

export function createMockWasmModule(overrides?: Partial<MockWasmModule>): MockWasmModule {
    const defaultModule: MockWasmModule = {
        version: "0.1.0-mock",
        createRenderer: () => ({
            loadFile: async () => createMockFileHandle(),
            destroy: () => { },
        }),
    };
    return { ...defaultModule, ...overrides };
}

export function createMockCanvas(width = 500, height = 500): HTMLCanvasElement {
    if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
    return { width, height, getContext: () => null } as unknown as HTMLCanvasElement;
}

export function createMockRiveFile() {
    return {
        name: "test.riv",
        artboards: [
            {
                name: "MainArtboard",
                width: 500,
                height: 500,
                animations: [
                    { name: "idle", duration: 1000, fps: 60, loop: Loop.Loop },
                    { name: "walk", duration: 500, fps: 60, loop: Loop.Loop },
                ],
                stateMachines: [
                    {
                        name: "MainStateMachine",
                        inputs: [
                            { name: "isRunning", type: StateMachineInputType.Boolean },
                            { name: "speed", type: StateMachineInputType.Number },
                            { name: "jump", type: StateMachineInputType.Trigger },
                        ],
                        states: ["Idle", "Run", "Jump"],
                    },
                ],
            },
        ],
    };
}

export const mockEnums = { Loop, Fit, Alignment, StateMachineInputType, RiveEventType };
