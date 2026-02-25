import { Fit, Alignment, DEFAULTS } from "@rive-monorepo/core";
import { loadWasmModule, WasmModule, RiveRenderer, RiveFileHandle } from "./wasm-loader";

export type PlaybackState = "idle" | "loading" | "loaded" | "playing" | "paused" | "error";

export interface RiveCanvasOptions {
    src: string | ArrayBuffer;
    canvas: HTMLCanvasElement;
    artboard?: string;
    animations?: string | string[];
    autoplay?: boolean;
    fit?: Fit;
    alignment?: Alignment;
    wasmModule?: WasmModule;
    onLoad?: () => void;
    onLoadError?: (err: Error) => void;
    onPlay?: (name: string) => void;
    onPause?: (name: string) => void;
    onStop?: (name: string) => void;
    onStateChange?: (stateMachineName: string, stateName: string) => void;
}

/**
 * RiveCanvas — high-level API for loading and playing a Rive animation on a canvas.
 * Mirrors @rive-app/canvas Rive class.
 */
export class RiveCanvas {
    private _canvas: HTMLCanvasElement;
    private _options: RiveCanvasOptions;
    private _state: PlaybackState = "idle";
    private _renderer: RiveRenderer | null = null;
    private _fileHandle: RiveFileHandle | null = null;
    private _currentAnimation: string | null = null;
    private _animationFrame: number | null = null;

    constructor(options: RiveCanvasOptions) {
        this._canvas = options.canvas;
        this._options = {
            fit: DEFAULTS.fit,
            alignment: DEFAULTS.alignment,
            autoplay: DEFAULTS.autoplay,
            ...options,
        };
        this._initialize();
    }

    private async _initialize(): Promise<void> {
        this._state = "loading";
        try {
            const wasm = await loadWasmModule(undefined, this._options.wasmModule);
            this._renderer = wasm.createRenderer(this._canvas);

            // Fetch or use the provided ArrayBuffer
            let data: ArrayBuffer;
            if (typeof this._options.src === "string") {
                const resp = await fetch(this._options.src);
                data = await resp.arrayBuffer();
            } else {
                data = this._options.src;
            }

            this._fileHandle = await this._renderer.loadFile(data);
            this._state = "loaded";
            this._options.onLoad?.();

            if (this._options.autoplay) {
                const anims = this._options.animations;
                const name = Array.isArray(anims) ? anims[0] : anims;
                this.play(name ?? this._fileHandle.animationName(0, 0));
            }
        } catch (err) {
            this._state = "error";
            this._options.onLoadError?.(err instanceof Error ? err : new Error(String(err)));
        }
    }

    /** Play an animation by name */
    play(animationName?: string): void {
        if (this._state === "loading") {
            console.warn("[RiveCanvas] Cannot play — still loading");
            return;
        }
        const name = animationName ?? this._fileHandle?.animationName(0, 0) ?? "idle";
        this._currentAnimation = name;
        this._state = "playing";
        this._options.onPlay?.(name);
        this._startRenderLoop();
    }

    /** Pause the current animation */
    pause(): void {
        if (this._animationFrame !== null) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        this._state = "paused";
        this._options.onPause?.(this._currentAnimation ?? "");
    }

    /** Stop the animation and reset */
    stop(): void {
        if (this._animationFrame !== null) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        this._currentAnimation = null;
        this._state = "loaded";
        this._options.onStop?.("");
        this._clearCanvas();
    }

    /** Clean up all resources */
    destroy(): void {
        this.stop();
        this._renderer?.destroy();
        this._renderer = null;
        this._fileHandle = null;
        this._state = "idle";
    }

    get playbackState(): PlaybackState {
        return this._state;
    }

    get currentAnimation(): string | null {
        return this._currentAnimation;
    }

    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    private _startRenderLoop(): void {
        const tick = () => {
            if (this._state !== "playing") return;
            this._renderFrame();
            this._animationFrame = requestAnimationFrame(tick);
        };
        this._animationFrame = requestAnimationFrame(tick);
    }

    private _renderFrame(): void {
        const ctx = this._canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        // In production: advance WASM renderer and draw frame
    }

    private _clearCanvas(): void {
        const ctx = this._canvas.getContext("2d");
        ctx?.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
}
