/** Supported loop modes for Rive animations */
export enum Loop {
    None = 0,
    Loop = 1,
    PingPong = 2,
    AutoLap = 3,
}

/** Fit modes for rendering Rive content into a canvas */
export enum Fit {
    Cover = "cover",
    Contain = "contain",
    Fill = "fill",
    FitWidth = "fitWidth",
    FitHeight = "fitHeight",
    None = "none",
    ScaleDown = "scaleDown",
}

/** Alignment of Rive content within the canvas */
export enum Alignment {
    Center = "center",
    TopLeft = "topLeft",
    TopCenter = "topCenter",
    TopRight = "topRight",
    CenterLeft = "centerLeft",
    CenterRight = "centerRight",
    BottomLeft = "bottomLeft",
    BottomCenter = "bottomCenter",
    BottomRight = "bottomRight",
}

/** Types of state machine inputs */
export enum StateMachineInputType {
    Boolean = 56,
    Number = 59,
    Trigger = 58,
}

/** Rive event types */
export enum RiveEventType {
    General = 128,
    OpenUrl = 131,
}

/** Default configuration values */
export const DEFAULTS = {
    fit: Fit.Contain,
    alignment: Alignment.Center,
    loop: Loop.None,
    autoplay: false,
} as const;

/** Current version of the monorepo */
export const MONOREPO_VERSION = "0.1.0";
