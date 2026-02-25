/**
 * electron-builder configuration
 * Builds macOS (.dmg, .zip) and Windows (.exe) installers.
 * Code signing and notarization are configured via environment variables
 * set in CI (see .github/workflows/release-desktop.yml).
 */

const fs = require("fs");

const notarizeHook = "scripts/notarize.js";
const hasNotarizeHook = fs.existsSync(notarizeHook);
const hasMacIcon = fs.existsSync("assets/icon.icns");
const hasWinIcon = fs.existsSync("assets/icon.ico");
const hasMacEntitlements = fs.existsSync("assets/entitlements.mac.plist");
const winCertSubject = process.env.WIN_CERTIFICATE_SUBJECT?.trim() || "";
const hasWindowsCert =
    winCertSubject !== "" &&
    winCertSubject.toLowerCase() !== "undefined" &&
    winCertSubject.toLowerCase() !== "null";
const [githubOwner, githubRepo] = (process.env.GITHUB_REPOSITORY || "").split("/");
const hasGitHubRepo = Boolean(githubOwner && githubRepo);

/** @type {import('electron-builder').Configuration} */
const config = {
    appId: "app.rive.editor",
    productName: "Rive Editor",
    copyright: "Copyright © 2024 Rive Inc.",
    extraMetadata: {
        // app.asar currently places dist-electron output at archive root
        // so point packaged app entry to main.js while keeping dev main unchanged
        main: "main.js",
    },

    directories: {
        output: "release",
        buildResources: "assets",
    },

    files: [
        "package.json",
        {
            from: "dist-electron",
            to: ".",
            filter: ["**/*", "!**/*.map"],
        },
        {
            from: "../web-editor/out",
            to: "web-editor/out",
            filter: ["**/*"],
        },
    ],

    // ─── macOS ──────────────────────────────────────────────────────────────────
    mac: {
        category: "public.app-category.graphics-design",
        ...(hasMacIcon ? { icon: "assets/icon.icns" } : {}),
        hardenedRuntime: true,
        gatekeeperAssess: false,
        ...(hasMacEntitlements
            ? {
                entitlements: "assets/entitlements.mac.plist",
                entitlementsInherit: "assets/entitlements.mac.plist",
            }
            : {}),
        target: [
            { target: "dmg", arch: ["x64", "arm64"] },
            { target: "zip", arch: ["x64", "arm64"] },
        ],
    },

    // Notarization hook — reads APPLE_ID, APPLE_TEAM_ID, APPLE_APP_SPECIFIC_PASSWORD from env
    ...(hasNotarizeHook ? { afterSign: notarizeHook } : {}),

    dmg: {
        contents: [
            { x: 130, y: 220 },
            { x: 410, y: 220, type: "link", path: "/Applications" },
        ],
    },

    // ─── Windows ────────────────────────────────────────────────────────────────
    win: {
        ...(hasWinIcon ? { icon: "assets/icon.ico" } : {}),
        target: [
            { target: "nsis", arch: ["x64"] },
        ],
        ...(hasWindowsCert
            ? {
                // Code signing certificate identity from CI secret.
                certificateSubjectName: winCertSubject,
                signingHashAlgorithms: ["sha256"],
            }
            : {}),
    },

    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        ...(hasWinIcon
            ? {
                installerIcon: "assets/icon.ico",
                uninstallerIcon: "assets/icon.ico",
            }
            : {}),
    },

    // Keep provider metadata available in CI so update info generation does not fail.
    ...(hasGitHubRepo
        ? {
            publish: {
                provider: "github",
                owner: githubOwner,
                repo: githubRepo,
                releaseType: "release",
            },
        }
        : {}),
};

module.exports = config;
