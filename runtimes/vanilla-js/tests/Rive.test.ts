import { describe, it, expect } from "vitest";
import { Rive } from "../src/Rive";

describe("Rive Vanilla JS", () => {
    it("should initialize with options", () => {
        const canvas = document.createElement("canvas");
        const rive = new Rive({
            src: new ArrayBuffer(8),
            canvas,
        });
        expect(rive).toBeDefined();
        expect(rive.canvas).toBe(canvas);
        expect(rive.isLoaded).toBe(false);
    });

    it("should have a play method", () => {
        const canvas = document.createElement("canvas");
        const rive = new Rive({
            src: new ArrayBuffer(8),
            canvas,
        });
        expect(typeof rive.play).toBe("function");
    });
});
