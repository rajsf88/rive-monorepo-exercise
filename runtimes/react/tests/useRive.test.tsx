import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRive } from "../src/useRive";

describe("useRive hook", () => {
    it("should return Rive components and state", () => {
        const { result } = renderHook(() => useRive({ src: "/test.riv" }));

        expect(result.current.RiveComponent).toBeDefined();
        expect(result.current.isLoaded).toBe(false);
        expect(result.current.isPlaying).toBe(false);
    });
});
