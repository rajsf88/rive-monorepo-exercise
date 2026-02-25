import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rive Editor",
    description: "Production-ready animation editor powered by Rive",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body style={{ margin: 0, padding: 0, background: "#0f0f0f", fontFamily: "system-ui, sans-serif" }}>
                {children}
            </body>
        </html>
    );
}
