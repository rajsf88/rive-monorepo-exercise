import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";

const isDev = !app.isPackaged;
const EDITOR_URL = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "web-editor/out/index.html")}`;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
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
            preload: path.join(__dirname, "preload.js"),
        },
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    });

    mainWindow.loadURL(EDITOR_URL);

    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // Open external links in browser
        shell.openExternal(url);
        return { action: "deny" };
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
    createWindow();

    // macOS: re-create window on dock click
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    // Auto-updater (production only)
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// ─── IPC Handlers ────────────────────────────────────────────────────────────

ipcMain.handle("app:version", () => app.getVersion());

ipcMain.handle("dialog:openFile", async () => {
    const result = await dialog.showOpenDialog({
        title: "Open Rive File",
        filters: [{ name: "Rive Files", extensions: ["riv"] }],
        properties: ["openFile"],
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("dialog:saveFile", async (_event, defaultName: string) => {
    const result = await dialog.showSaveDialog({
        title: "Save Rive File",
        defaultPath: defaultName,
        filters: [{ name: "Rive Files", extensions: ["riv"] }],
    });
    return result.canceled ? null : result.filePath;
});

// ─── Auto Updater Events ─────────────────────────────────────────────────────

autoUpdater.on("update-available", () => {
    mainWindow?.webContents.send("app:update-available");
});

autoUpdater.on("update-downloaded", () => {
    mainWindow?.webContents.send("app:update-downloaded");
});
