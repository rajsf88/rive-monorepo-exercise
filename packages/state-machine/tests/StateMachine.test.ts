import { describe, it, expect, vi } from "vitest";
import { StateMachine } from "../src/StateMachine";
import { StateMachineInputType } from "@rive-monorepo/core";

describe("StateMachine", () => {
    it("should create a state machine with a name", () => {
        const sm = new StateMachine("MyMachine");
        expect(sm.name).toBe("MyMachine");
        expect(sm.isPlaying).toBe(false);
        expect(sm.currentState).toBeNull();
    });

    it("should add and retrieve states", () => {
        const sm = new StateMachine("test");
        const idle = sm.addState("Idle");
        const run = sm.addState("Run");
        expect(sm.getState("Idle")).toBe(idle);
        expect(sm.getState("Run")).toBe(run);
        expect(sm.allStates).toHaveLength(2);
    });

    it("should play from an initial state", () => {
        const sm = new StateMachine("test");
        sm.addState("Idle");
        sm.play("Idle");
        expect(sm.isPlaying).toBe(true);
        expect(sm.currentState?.name).toBe("Idle");
        expect(sm.currentState?.isActive).toBe(true);
    });

    it("should throw when playing a non-existent state", () => {
        const sm = new StateMachine("test");
        expect(() => sm.play("Missing")).toThrow('State not found: "Missing"');
    });

    it("should pause and stop correctly", () => {
        const sm = new StateMachine("test");
        sm.addState("Idle");
        sm.play("Idle");
        sm.pause();
        expect(sm.isPlaying).toBe(false);
        sm.play("Idle");
        sm.stop();
        expect(sm.isPlaying).toBe(false);
        expect(sm.currentState).toBeNull();
    });

    it("should transition state on boolean input", () => {
        const sm = new StateMachine("test");
        const idle = sm.addState("Idle");
        const run = sm.addState("Run");
        const isRunning = sm.addBooleanInput("isRunning", false);
        idle.addTransition("isRunning", run);

        sm.play("Idle");
        sm.advance(); // no transition yet (isRunning = false)
        expect(sm.currentState?.name).toBe("Idle");

        isRunning.value = true;
        sm.advance(); // transitions to Run
        expect(sm.currentState?.name).toBe("Run");
    });

    it("should fire callbacks on state change", () => {
        const sm = new StateMachine("test");
        sm.addState("Idle");
        const run = sm.addState("Run");
        const isRunning = sm.addBooleanInput("isRunning", false);
        sm.getState("Idle")!.addTransition("isRunning", run);

        const callback = vi.fn();
        sm.onStateChange(callback);
        sm.play("Idle");
        expect(callback).toHaveBeenCalledWith("test", "Idle");

        isRunning.value = true;
        sm.advance();
        expect(callback).toHaveBeenCalledWith("test", "Run");
        expect(callback).toHaveBeenCalledTimes(2);
    });

    it("should manage boolean input correctly", () => {
        const sm = new StateMachine("test");
        const input = sm.addBooleanInput("active", false);
        expect(input.type).toBe(StateMachineInputType.Boolean);
        expect(input.value).toBe(false);
        input.value = true;
        expect(input.value).toBe(true);
    });

    it("should manage number input correctly", () => {
        const sm = new StateMachine("test");
        const input = sm.addNumberInput("speed", 0);
        expect(input.type).toBe(StateMachineInputType.Number);
        input.value = 42;
        expect(input.value).toBe(42);
    });

    it("should fire trigger input without error", () => {
        const sm = new StateMachine("test");
        const trigger = sm.addTriggerInput("jump");
        expect(() => trigger.fire()).not.toThrow();
        expect(trigger.value).toBeUndefined();
    });

    it("should serialize to JSON", () => {
        const sm = new StateMachine("test");
        sm.addState("Idle");
        sm.addBooleanInput("active", false);
        const json = sm.toJSON();
        expect(json.name).toBe("test");
        expect(json.states).toHaveLength(1);
        expect(json.inputs).toHaveLength(1);
    });
});
