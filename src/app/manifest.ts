import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "My Little Magik Book",
        short_name: "Magik Book",
        description: "Build and share your Magic decks.",
        start_url: "/",
        scope: "/",
        display_override: ["window-controls-overlay", "standalone"],
        display: "standalone",
        background_color: "#111827",
        theme_color: "#111827",
        icons: [
            {
                src: "/icons/icon-192.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "maskable",
            },
            {
                src: "/icons/icon-512.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    };
}
