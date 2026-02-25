"use client";

import { useRive } from "@rive-monorepo/react";
import { Fit, Alignment } from "@rive-monorepo/core";
import styles from "./page.module.css";

export default function EditorPage() {
    const { RiveComponent, isLoaded, isPlaying, play, pause } = useRive({
        // In production: a real .riv file URL. Here we use a placeholder.
        src: "/animations/demo.riv",
        autoplay: true,
        fit: Fit.Contain,
        alignment: Alignment.Center,
        onLoad: () => console.log("[Editor] Rive file loaded"),
        onPlay: (name) => console.log(`[Editor] Playing: ${name}`),
        onPause: (name) => console.log(`[Editor] Paused: ${name}`),
    });

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <circle cx="14" cy="14" r="14" fill="#FF3D00" />
                        <path d="M8 8h5.5c2.5 0 4.5 2 4.5 4.5S16 17 13.5 17H8V8z" fill="white" />
                        <path d="M13.5 17L20 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Rive Editor
                </div>
                <nav className={styles.nav}>
                    <span className={styles.badge}>
                        {isLoaded ? (isPlaying ? "▶ Playing" : "⏸ Paused") : "Loading…"}
                    </span>
                </nav>
            </header>

            {/* Canvas Area */}
            <section className={styles.canvas_area}>
                <div className={styles.canvas_wrapper}>
                    <RiveComponent
                        width={600}
                        height={400}
                        id="rive-main-canvas"
                        className={styles.canvas}
                    />
                    {!isLoaded && (
                        <div className={styles.loading_overlay}>
                            <div className={styles.spinner} />
                            <p>Loading animation…</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <button
                        id="btn-play"
                        className={styles.btn}
                        onClick={() => play()}
                        disabled={!isLoaded || isPlaying}
                    >
                        ▶ Play
                    </button>
                    <button
                        id="btn-pause"
                        className={styles.btn}
                        onClick={pause}
                        disabled={!isLoaded || !isPlaying}
                    >
                        ⏸ Pause
                    </button>
                </div>
            </section>

            {/* Info Panel */}
            <aside className={styles.panel}>
                <h2 className={styles.panel_title}>Animation Properties</h2>
                <ul className={styles.prop_list}>
                    <li><span>Status</span><strong>{isLoaded ? "Loaded" : "Loading"}</strong></li>
                    <li><span>Playback</span><strong>{isPlaying ? "Playing" : "Paused"}</strong></li>
                    <li><span>Fit</span><strong>Contain</strong></li>
                    <li><span>Alignment</span><strong>Center</strong></li>
                    <li><span>Runtime</span><strong>@rive-monorepo/react v0.1.0</strong></li>
                </ul>
            </aside>
        </main>
    );
}
// dummy release test
