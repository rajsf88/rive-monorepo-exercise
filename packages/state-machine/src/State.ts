/** A single state within a state machine */
export class State {
    readonly name: string;
    private _active: boolean = false;
    private _transitions: Map<string, State> = new Map();

    constructor(name: string) {
        this.name = name;
    }

    get isActive(): boolean {
        return this._active;
    }

    /** @internal called by StateMachine */
    _activate(): void {
        this._active = true;
    }

    /** @internal called by StateMachine */
    _deactivate(): void {
        this._active = false;
    }

    /** Add a transition: from this state, on `inputName` value match, go to `target` */
    addTransition(inputName: string, target: State): this {
        this._transitions.set(inputName, target);
        return this;
    }

    /** Check if a transition exists for the given input name */
    getTransitionTarget(inputName: string): State | undefined {
        return this._transitions.get(inputName);
    }

    toJSON() {
        return {
            name: this.name,
            active: this._active,
            transitions: Array.from(this._transitions.keys()),
        };
    }
}
