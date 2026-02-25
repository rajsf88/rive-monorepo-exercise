import { RiveCanvas } from "@rive-monorepo/canvas-renderer";
import { Fit, Alignment, DEFAULTS } from "@rive-monorepo/core";
import type { RiveCanvasOptions } from "@rive-monorepo/canvas-renderer";

export type { RiveCanvasOptions };
export { Fit, Alignment };

/**
 * Rive — high-level vanilla JS class.
 * Mirrors @rive-app/canvas `Rive` class.
 * 
 * @example
 * const r = new Rive({ src: "/hero.riv", canvas: document.getElementById("canvas"), autoplay: true });
 * r.on("load", () => console.log("ready!"));
 * r.play("walk");
 */
export class Rive {
    private _core: RiveCanvas;
    private _eventListeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

    constructor(options: RiveCanvasOptions) {
        this._core = new RiveCanvas({
            ...options,
            fit: options.fit ?? DEFAULTS.fit,
            alignment: options.alignment ?? DEFAULTS.alignment,
            onLoad: () => this._emit("load"),
            onLoadError: (err: Error) => this._emit("loaderror", err),
            onPlay: (name: string) => this._emit("play", name),
            onPause: (name: string) => this._emit("pause", name),
            onStop: (name: string) => this._emit("stop", name),
            onStateChange: (sm: string, state: string) => this._emit("statechange", sm, state),
        });
    }

    // ─── Playback ───────────────────────────────────────────────────────────────

    play(animationName?: string): this {
        this._core.play(animationName);
        return this;
    }

    pause(): this {
        this._core.pause();
        return this;
    }

    stop(): this {
        this._core.stop();
        return this;
    }

    destroy(): void {
        this._core.destroy();
        this._eventListeners.clear();
    }

    // ─── Events ─────────────────────────────────────────────────────────────────

    on(event: string, callback: (...args: unknown[]) => void): this {
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, new Set());
        }
        this._eventListeners.get(event)!.add(callback);
        return this;
    }

    off(event: string, callback: (...args: unknown[]) => void): this {
        this._eventListeners.get(event)?.delete(callback);
        return this;
    }

    private _emit(event: string, ...args: unknown[]): void {
        this._eventListeners.get(event)?.forEach((cb) => cb(...args));
    }

    // ─── Getters ─────────────────────────────────────────────────────────────────

    get isPlaying(): boolean {
        return this._core.playbackState === "playing";
    }

    get isLoaded(): boolean {
        return (
            this._core.playbackState === "loaded" ||
            this._core.playbackState === "playing" ||
            this._core.playbackState === "paused"
        );
    }

    get canvas(): HTMLCanvasElement {
        return this._core.canvas;
    }
}
