import { StateMachineInputType } from "@rive-monorepo/core";

/**
 * Represents a single input on a state machine.
 * Mirrors rive-runtime's SMIInput concept.
 */
export class Input {
    readonly name: string;
    readonly type: StateMachineInputType;
    private _value: boolean | number | undefined;

    constructor(name: string, type: StateMachineInputType, defaultValue?: boolean | number) {
        this.name = name;
        this.type = type;
        this._value = defaultValue;
    }

    get value(): boolean | number | undefined {
        if (this.type === StateMachineInputType.Trigger) return undefined;
        return this._value;
    }

    set value(v: boolean | number) {
        if (this.type === StateMachineInputType.Trigger) {
            throw new Error(`Cannot set value on a Trigger input: "${this.name}"`);
        }
        if (this.type === StateMachineInputType.Boolean && typeof v !== "boolean") {
            throw new TypeError(`Boolean input "${this.name}" expects a boolean value`);
        }
        if (this.type === StateMachineInputType.Number && typeof v !== "number") {
            throw new TypeError(`Number input "${this.name}" expects a number value`);
        }
        this._value = v;
    }

    /** Fire a trigger input */
    fire(): void {
        if (this.type !== StateMachineInputType.Trigger) {
            throw new Error(`Only Trigger inputs can be fired. "${this.name}" is type ${this.type}`);
        }
        // In a real runtime, this would cause the WASM state machine to evaluate transitions
    }

    toJSON() {
        return { name: this.name, type: this.type, value: this._value };
    }
}
