import React from "react";
import { useRive } from "./useRive";
import type { UseRiveOptions } from "./useRive";

export interface RiveAnimationProps
    extends UseRiveOptions,
    Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, "onLoad" | "onPlay" | "onPause"> {
    /** Width of the canvas in px */
    width?: number;
    /** Height of the canvas in px */
    height?: number;
}

/**
 * RiveAnimation — drop-in React component for embedding Rive animations.
 * Mirrors the component pattern in @rive-app/react-canvas.
 *
 * @example
 * <RiveAnimation
 *   src="/animations/hero.riv"
 *   autoplay
 *   width={500}
 *   height={500}
 *   onLoad={() => console.log("loaded")}
 * />
 */
export const RiveAnimation: React.FC<RiveAnimationProps> = ({
    src,
    artboard,
    animations,
    autoplay,
    fit,
    alignment,
    onLoad,
    onLoadError,
    onPlay,
    onPause,
    onStop,
    onStateChange,
    wasmModule,
    width = 500,
    height = 500,
    style,
    ...canvasProps
}) => {
    const { RiveComponent, isLoaded } = useRive({
        src,
        artboard,
        animations,
        autoplay,
        fit,
        alignment,
        onLoad,
        onLoadError,
        onPlay,
        onPause,
        onStop,
        onStateChange,
        wasmModule,
    });

    return (
        <RiveComponent
            width={width}
            height={height}
            style={{
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.2s ease",
                ...style,
            }}
            aria-label="Rive animation"
            data-testid="rive-canvas"
            {...canvasProps}
        />
    );
};

RiveAnimation.displayName = "RiveAnimation";
