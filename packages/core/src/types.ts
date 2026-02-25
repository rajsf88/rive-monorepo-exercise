import { Loop, Fit, Alignment, StateMachineInputType, RiveEventType } from "./constants";

// ─── Rive File / Asset Types ──────────────────────────────────────────────────

/** Represents a loaded .riv file */
export interface RiveFile {
    readonly name: string;
    readonly artboards: Artboard[];
}

/** A named artboard within a Rive file */
export interface Artboard {
    readonly name: string;
    readonly animations: AnimationDef[];
    readonly stateMachines: StateMachineDef[];
    readonly width: number;
    readonly height: number;
}

/** An animation definition stored in a Rive file */
export interface AnimationDef {
    readonly name: string;
    readonly duration: number;
    readonly fps: number;
    readonly loop: Loop;
}

// ─── State Machine Types ──────────────────────────────────────────────────────

/** A state machine definition stored in a Rive file */
export interface StateMachineDef {
    readonly name: string;
    readonly inputs: StateMachineInputDef[];
    readonly states: string[];
}

/** A single state machine input definition */
export interface StateMachineInputDef {
    readonly name: string;
    readonly type: StateMachineInputType;
}

/** Runtime state machine input value */
export type StateMachineInput =
    | { type: StateMachineInputType.Boolean; name: string; value: boolean }
    | { type: StateMachineInputType.Number; name: string; value: number }
    | { type: StateMachineInputType.Trigger; name: string };

// ─── Runtime / Render Types ───────────────────────────────────────────────────

/** Options passed when loading a Rive animation */
export interface RiveLoadOptions {
    /** URL or ArrayBuffer of the .riv file */
    src: string | ArrayBuffer;
    /** Canvas element or selector */
    canvas: HTMLCanvasElement | string;
    /** Artboard name (defaults to first) */
    artboard?: string;
    /** Animation name(s) to play */
    animations?: string | string[];
    /** State machine name to activate */
    stateMachines?: string | string[];
    /** Auto-play on load */
    autoplay?: boolean;
    fit?: Fit;
    alignment?: Alignment;
    onLoad?: () => void;
    onLoadError?: (error: Error) => void;
    onPlay?: (animationName: string) => void;
    onPause?: (animationName: string) => void;
    onStop?: (animationName: string) => void;
    onLoop?: (animationName: string) => void;
    onStateChange?: (stateMachineName: string, stateName: string) => void;
    onRiveEvent?: (event: RiveEvent) => void;
}

/** A Rive runtime event fired during playback */
export interface RiveEvent {
    readonly type: RiveEventType;
    readonly name: string;
    readonly data?: Record<string, unknown>;
}

/** Bounds of an artboard or object */
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/** Canvas layout settings for rendering */
export interface LayoutConfig {
    fit: Fit;
    alignment: Alignment;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
}
