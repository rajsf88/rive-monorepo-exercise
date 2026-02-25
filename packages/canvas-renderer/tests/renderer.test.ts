import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiveCanvas } from "../src/renderer";
import { resetWasmCache } from "../src/wasm-loader";
import type { WasmModule } from "../src/wasm-loader";

// ─── Mock WASM Module ─────────────────────────────────────────────────────────
const mockFile = {
    artboardCount: 1,
    artboardName: () => "TestArtboard",
    animationCount: () => 2,
    animationName: (_ai: number, i: number) => (i === 0 ? "idle" : "walk"),
    stateMachineCount: () => 1,
    stateMachineName: () => "Main",
};

const mockRenderer = {
    loadFile: vi.fn().mockResolvedValue(mockFile),
    destroy: vi.fn(),
};

const mockWasm: WasmModule = {
    version: "0.1.0-test",
    createRenderer: vi.fn().mockReturnValue(mockRenderer),
};

function makeCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    return canvas;
}

describe("RiveCanvas", () => {
    beforeEach(() => {
        resetWasmCache();
        vi.clearAllMocks();
        mockRenderer.loadFile.mockResolvedValue(mockFile);
    });

    it("should start in loading state", () => {
        const rive = new RiveCanvas({
            src: new ArrayBuffer(8),
            canvas: makeCanvas(),
            wasmModule: mockWasm,
        });
        expect(rive.playbackState).toBe("loading");
    });

    it("should transition to loaded after initialization", async () => {
        const onLoad = vi.fn();
        const rive = new RiveCanvas({
            src: new ArrayBuffer(8),
            canvas: makeCanvas(),
            wasmModule: mockWasm,
            onLoad,
        });
        await vi.waitFor(() => expect(rive.playbackState).toBe("loaded"));
        expect(onLoad).toHaveBeenCalledOnce();
    });

    it("should auto-play when autoplay is true", async () => {
        const onPlay = vi.fn();
        const rive = new RiveCanvas({
            src: new ArrayBuffer(8),
            canvas: makeCanvas(),
            wasmModule: mockWasm,
            autoplay: true,
            onPlay,
        });
        await vi.waitFor(() => expect(rive.playbackState).toBe("playing"));
        expect(onPlay).toHaveBeenCalledWith("idle");
        rive.destroy();
    });

    it("should play, pause, and stop correctly", async () => {
        const onPlay = vi.fn();
        const onPause = vi.fn();
        const onStop = vi.fn();
        const rive = new RiveCanvas({
            src: new ArrayBuffer(8),
            canvas: makeCanvas(),
            wasmModule: mockWasm,
            onPlay,
            onPause,
            onStop,
        });
        await vi.waitFor(() => expect(rive.playbackState).toBe("loaded"));

        rive.play("idle");
        expect(rive.playbackState).toBe("playing");
        expect(rive.currentAnimation).toBe("idle");
        expect(onPlay).toHaveBeenCalledWith("idle");

        rive.pause();
        expect(rive.playbackState).toBe("paused");
        expect(onPause).toHaveBeenCalled();

        rive.stop();
        expect(rive.playbackState).toBe("loaded");
        expect(onStop).toHaveBeenCalled();
        rive.destroy();
    });

    it("should call onLoadError when loading fails", async () => {
        mockRenderer.loadFile.mockRejectedValueOnce(new Error("WASM load failed"));
        const onLoadError = vi.fn();
        new RiveCanvas({
            src: new ArrayBuffer(8),
            canvas: makeCanvas(),
            wasmModule: mockWasm,
            onLoadError,
        });
        await vi.waitFor(() => expect(onLoadError).toHaveBeenCalled());
        expect(onLoadError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should destroy and clean up resources", async () => {
        const rive = new RiveCanvas({
            src: new ArrayBuffer(8),
            canvas: makeCanvas(),
            wasmModule: mockWasm,
        });
        await vi.waitFor(() => expect(rive.playbackState).toBe("loaded"));
        rive.destroy();
        expect(mockRenderer.destroy).toHaveBeenCalled();
        expect(rive.playbackState).toBe("idle");
    });
});
