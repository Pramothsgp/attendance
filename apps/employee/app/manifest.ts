import type { MetadataRoute } from "next";

// Makes the app installable ("Add to Home Screen"); it then opens full screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "My attendance & pay",
    short_name: "My pay",
    description: "Your days worked and your pay.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f7f9",
    theme_color: "#f6f7f9",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
