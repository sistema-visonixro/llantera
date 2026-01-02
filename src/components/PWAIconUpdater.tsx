import { useEffect } from "react";
import getCompanyData from "../lib/getCompanyData";

// Component to dynamically update PWA icons and manifest with company logo
export default function PWAIconUpdater() {
  useEffect(() => {
    let mounted = true;

    const updatePWAIcons = async () => {
      try {
        const company = await getCompanyData();
        if (!mounted || !company || !company.logoUrl) return;

        const logoUrl = company.logoUrl;
        const companyName =
          company.nombre || company.comercio || company.name || "SET POS";

        // Update manifest dynamically
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          // Create dynamic manifest with company logo
          const manifest = {
            name: `${companyName} - Sistema de Punto de Ventas`,
            short_name: companyName.substring(0, 12),
            description: "Sistema de punto de ventas y gestión de inventario",
            start_url: "/",
            scope: "/",
            display: "standalone",
            orientation: "any",
            background_color: "#ffffff",
            theme_color: "#1e293b",
            icons: [
              {
                src: logoUrl,
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
              },
              {
                src: logoUrl,
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
              },
            ],
            categories: ["business", "productivity"],
            prefer_related_applications: false,
          };

          const manifestBlob = new Blob([JSON.stringify(manifest)], {
            type: "application/json",
          });
          const manifestUrl = URL.createObjectURL(manifestBlob);
          manifestLink.setAttribute("href", manifestUrl);
        }

        // Update apple-touch-icon
        let appleTouchIcon = document.querySelector(
          'link[rel="apple-touch-icon"]'
        ) as HTMLLinkElement;
        if (!appleTouchIcon) {
          appleTouchIcon = document.createElement("link") as HTMLLinkElement;
          appleTouchIcon.rel = "apple-touch-icon";
          document.head.appendChild(appleTouchIcon);
        }
        appleTouchIcon.setAttribute("href", logoUrl);

        // Update favicon
        let favicon = document.querySelector(
          'link[rel="icon"]'
        ) as HTMLLinkElement;
        if (favicon) {
          favicon.setAttribute("href", logoUrl);
        }

        console.log("PWA icons updated with company logo:", logoUrl);
      } catch (error) {
        console.warn("Error updating PWA icons:", error);
      }
    };

    updatePWAIcons();

    return () => {
      mounted = false;
    };
  }, []);

  return null; // This component doesn't render anything
}
