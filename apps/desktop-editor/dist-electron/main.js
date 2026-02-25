"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const path_1 = __importDefault(require("path"));
const isDev = !electron_1.app.isPackaged;
const EDITOR_URL = isDev
    ? "http://localhost:3000"
    : `file://${path_1.default.join(__dirname, "web-editor/out/index.html")}`;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: "Rive Editor",
        backgroundColor: "#0f0f0f",
        show: false, // show after ready-to-show for smooth startup
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, "preload.js"),
        },
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    });
    mainWindow.loadURL(EDITOR_URL);
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Open external links in browser
        electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
// ─── App Lifecycle ───────────────────────────────────────────────────────────
electron_1.app.whenReady().then(() => {
    createWindow();
    // macOS: re-create window on dock click
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
    // Auto-updater (production only)
    if (!isDev) {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
// ─── IPC Handlers ────────────────────────────────────────────────────────────
electron_1.ipcMain.handle("app:version", () => electron_1.app.getVersion());
electron_1.ipcMain.handle("dialog:openFile", async () => {
    const result = await electron_1.dialog.showOpenDialog({
        title: "Open Rive File",
        filters: [{ name: "Rive Files", extensions: ["riv"] }],
        properties: ["openFile"],
    });
    return result.canceled ? null : result.filePaths[0];
});
electron_1.ipcMain.handle("dialog:saveFile", async (_event, defaultName) => {
    const result = await electron_1.dialog.showSaveDialog({
        title: "Save Rive File",
        defaultPath: defaultName,
        filters: [{ name: "Rive Files", extensions: ["riv"] }],
    });
    return result.canceled ? null : result.filePath;
});
// ─── Auto Updater Events ─────────────────────────────────────────────────────
electron_updater_1.autoUpdater.on("update-available", () => {
    mainWindow?.webContents.send("app:update-available");
});
electron_updater_1.autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("app:update-downloaded");
});
//# sourceMappingURL=main.js.map