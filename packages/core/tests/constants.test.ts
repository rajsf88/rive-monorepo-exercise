import { describe, it, expect } from "vitest";
import { Loop, Fit, Alignment, StateMachineInputType, DEFAULTS, MONOREPO_VERSION } from "../src";

describe("constants", () => {
    it("should export Loop enum with correct values", () => {
        expect(Loop.None).toBe(0);
        expect(Loop.Loop).toBe(1);
        expect(Loop.PingPong).toBe(2);
        expect(Loop.AutoLap).toBe(3);
    });

    it("should export Fit enum", () => {
        expect(Fit.Cover).toBe("cover");
        expect(Fit.Contain).toBe("contain");
        expect(Fit.Fill).toBe("fill");
    });

    it("should export Alignment enum", () => {
        expect(Alignment.Center).toBe("center");
        expect(Alignment.TopLeft).toBe("topLeft");
        expect(Alignment.BottomRight).toBe("bottomRight");
    });

    it("should export StateMachineInputType enum", () => {
        expect(StateMachineInputType.Boolean).toBe(56);
        expect(StateMachineInputType.Number).toBe(59);
        expect(StateMachineInputType.Trigger).toBe(58);
    });

    it("should export correct DEFAULTS", () => {
        expect(DEFAULTS.fit).toBe(Fit.Contain);
        expect(DEFAULTS.alignment).toBe(Alignment.Center);
        expect(DEFAULTS.loop).toBe(Loop.None);
        expect(DEFAULTS.autoplay).toBe(false);
    });

    it("should export MONOREPO_VERSION as semver string", () => {
        expect(MONOREPO_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
});
