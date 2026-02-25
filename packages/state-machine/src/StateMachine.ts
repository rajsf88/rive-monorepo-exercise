import { StateMachineInputType } from "@rive-monorepo/core";
import { Input } from "./Input";
import { State } from "./State";

export type StateChangeCallback = (machineName: string, stateName: string) => void;

/**
 * StateMachine — mirrors Rive's runtime state machine.
 * Manages states, inputs, transitions, and notifies listeners on state change.
 */
export class StateMachine {
    readonly name: string;
    private _states: Map<string, State> = new Map();
    private _inputs: Map<string, Input> = new Map();
    private _currentState: State | null = null;
    private _listeners: StateChangeCallback[] = [];
    private _isPlaying: boolean = false;

    constructor(name: string) {
        this.name = name;
    }

    // ─── State Management ───────────────────────────────────────────────────────

    addState(name: string): State {
        const state = new State(name);
        this._states.set(name, state);
        return state;
    }

    getState(name: string): State | undefined {
        return this._states.get(name);
    }

    get currentState(): State | null {
        return this._currentState;
    }

    get allStates(): State[] {
        return Array.from(this._states.values());
    }

    // ─── Input Management ───────────────────────────────────────────────────────

    addBooleanInput(name: string, defaultValue = false): Input {
        const input = new Input(name, StateMachineInputType.Boolean, defaultValue);
        this._inputs.set(name, input);
        return input;
    }

    addNumberInput(name: string, defaultValue = 0): Input {
        const input = new Input(name, StateMachineInputType.Number, defaultValue);
        this._inputs.set(name, input);
        return input;
    }

    addTriggerInput(name: string): Input {
        const input = new Input(name, StateMachineInputType.Trigger);
        this._inputs.set(name, input);
        return input;
    }

    getInput(name: string): Input | undefined {
        return this._inputs.get(name);
    }

    get allInputs(): Input[] {
        return Array.from(this._inputs.values());
    }

    // ─── Playback ───────────────────────────────────────────────────────────────

    /** Start the state machine from the given initial state */
    play(initialStateName: string): void {
        const state = this._states.get(initialStateName);
        if (!state) throw new Error(`State not found: "${initialStateName}"`);
        this._currentState?._deactivate();
        this._currentState = state;
        state._activate();
        this._isPlaying = true;
        this._notifyListeners();
    }

    pause(): void {
        this._isPlaying = false;
    }

    stop(): void {
        this._isPlaying = false;
        this._currentState?._deactivate();
        this._currentState = null;
    }

    get isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * Advance the state machine by one tick.
     * Evaluates transitions based on current input values.
     */
    advance(): void {
        if (!this._isPlaying || !this._currentState) return;

        for (const [inputName, input] of this._inputs) {
            const target = this._currentState.getTransitionTarget(inputName);
            if (!target) continue;

            let shouldTransition = false;
            if (input.type === StateMachineInputType.Boolean && input.value === true) {
                shouldTransition = true;
            } else if (input.type === StateMachineInputType.Trigger) {
                shouldTransition = true;
            }

            if (shouldTransition) {
                this._currentState._deactivate();
                this._currentState = target;
                target._activate();
                this._notifyListeners();
                break;
            }
        }
    }

    // ─── Events ─────────────────────────────────────────────────────────────────

    onStateChange(callback: StateChangeCallback): void {
        this._listeners.push(callback);
    }

    removeStateChangeListener(callback: StateChangeCallback): void {
        this._listeners = this._listeners.filter((l) => l !== callback);
    }

    private _notifyListeners(): void {
        if (this._currentState) {
            this._listeners.forEach((l) => l(this.name, this._currentState!.name));
        }
    }

    toJSON() {
        return {
            name: this.name,
            currentState: this._currentState?.name ?? null,
            isPlaying: this._isPlaying,
            states: this.allStates.map((s) => s.toJSON()),
            inputs: this.allInputs.map((i) => i.toJSON()),
        };
    }
}
