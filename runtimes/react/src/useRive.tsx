import { useRef, useEffect, useCallback, useState } from "react";
import { RiveCanvas } from "@rive-monorepo/canvas-renderer";
import { Fit, Alignment, DEFAULTS } from "@rive-monorepo/core";
import type { RiveCanvasOptions } from "@rive-monorepo/canvas-renderer";

export interface UseRiveOptions
    extends Omit<RiveCanvasOptions, "canvas"> {
    fit?: Fit;
    alignment?: Alignment;
}

export interface UseRiveReturn {
    RiveComponent: React.FC<React.CanvasHTMLAttributes<HTMLCanvasElement>>;
    rive: RiveCanvas | null;
    canvas: HTMLCanvasElement | null;
    isPlaying: boolean;
    isLoaded: boolean;
    play: (animationName?: string) => void;
    pause: () => void;
    stop: () => void;
}

/**
 * useRive — React hook for loading and controlling a Rive animation.
 * Mirrors @rive-app/react-canvas useRive() hook.
 */
export function useRive(options: UseRiveOptions): UseRiveReturn {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const riveRef = useRef<RiveCanvas | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !options.src) return;

        const rive = new RiveCanvas({
            ...options,
            canvas,
            fit: options.fit ?? DEFAULTS.fit,
            alignment: options.alignment ?? DEFAULTS.alignment,
            onLoad: () => {
                setIsLoaded(true);
                options.onLoad?.();
            },
            onPlay: (name) => {
                setIsPlaying(true);
                options.onPlay?.(name);
            },
            onPause: (name) => {
                setIsPlaying(false);
                options.onPause?.(name);
            },
            onStop: (name) => {
                setIsPlaying(false);
                options.onStop?.(name);
            },
        });
        riveRef.current = rive;

        return () => {
            rive.destroy();
            riveRef.current = null;
            setIsLoaded(false);
            setIsPlaying(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const play = useCallback((animationName?: string) => {
        riveRef.current?.play(animationName);
    }, []);

    const pause = useCallback(() => {
        riveRef.current?.pause();
    }, []);

    const stop = useCallback(() => {
        riveRef.current?.stop();
    }, []);

    const RiveComponent: React.FC<React.CanvasHTMLAttributes<HTMLCanvasElement>> = useCallback(
        (props: React.CanvasHTMLAttributes<HTMLCanvasElement>) => <canvas ref={canvasRef} {...props} />,
        []
    );

    return {
        RiveComponent,
        rive: riveRef.current,
        canvas: canvasRef.current,
        isPlaying,
        isLoaded,
        play,
        pause,
        stop,
    };
}
