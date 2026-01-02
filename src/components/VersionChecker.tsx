import React, { useEffect, useState } from "react";

interface VersionInfo {
  version: string;
  buildDate: string;
  changelog: string;
}

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const CURRENT_VERSION_KEY = "app_current_version";

// Export utility function for manual version check
export const checkForUpdatesManually = async (): Promise<{
  hasUpdate: boolean;
  versionInfo: VersionInfo | null;
}> => {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      return { hasUpdate: false, versionInfo: null };
    }

    const remoteVersion: VersionInfo = await response.json();
    const localVersion = localStorage.getItem(CURRENT_VERSION_KEY);

    if (!localVersion) {
      localStorage.setItem(CURRENT_VERSION_KEY, remoteVersion.version);
      return { hasUpdate: false, versionInfo: remoteVersion };
    }

    if (remoteVersion.version !== localVersion) {
      return { hasUpdate: true, versionInfo: remoteVersion };
    }

    return { hasUpdate: false, versionInfo: remoteVersion };
  } catch (error) {
    console.debug("Error checking for updates:", error);
    return { hasUpdate: false, versionInfo: null };
  }
};

// Export utility function for performing update
export const performUpdate = async (newVersion?: string) => {
  try {
    // Clear all caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("All caches cleared");
    }

    // Unregister all service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
      console.log("Service workers unregistered");
    }

    // Update stored version
    if (newVersion) {
      localStorage.setItem(CURRENT_VERSION_KEY, newVersion);
    }

    // Force reload from server
    window.location.reload();
  } catch (error) {
    console.error("Error during update:", error);
    // Still try to reload
    window.location.reload();
  }
};

export default function VersionChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = async () => {
    try {
      // Fetch version.json with cache-busting to always get the latest
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.debug("Could not fetch version info");
        return;
      }

      const remoteVersion: VersionInfo = await response.json();
      const localVersion = localStorage.getItem(CURRENT_VERSION_KEY);

      console.debug("Version check:", {
        local: localVersion,
        remote: remoteVersion.version,
      });

      // If no local version stored, set it (first time)
      if (!localVersion) {
        localStorage.setItem(CURRENT_VERSION_KEY, remoteVersion.version);
        return;
      }

      // Compare versions
      if (remoteVersion.version !== localVersion) {
        console.log("New version available:", remoteVersion.version);
        setNewVersion(remoteVersion);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.debug("Error checking for updates:", error);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    await performUpdate(newVersion?.version);
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
    // Remember user dismissed this version (optional)
    if (newVersion) {
      localStorage.setItem(`dismissed_version_${newVersion.version}`, "true");
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkForUpdates();

    // Set up periodic checks
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable || !newVersion) return null;

  return (
    <>
      <style>{`
        .version-update-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          animation: fadeIn 300ms ease-out;
        }
        .version-update-modal {
          background: white;
          border-radius: 16px;
          padding: 28px;
          width: 90%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(2, 6, 23, 0.4);
          animation: slideUp 350ms ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .version-update-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .version-update-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          text-align: center;
          margin: 0 0 12px 0;
        }
        .version-update-subtitle {
          color: #64748b;
          text-align: center;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }
        .version-update-version {
          background: #f1f5f9;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
        }
        .version-update-version-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .version-update-version-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: #3b82f6;
        }
        .version-update-changelog {
          background: #fefce8;
          border: 1px solid #fde047;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 0.875rem;
          color: #854d0e;
        }
        .version-update-actions {
          display: flex;
          gap: 12px;
        }
        .version-update-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 150ms;
        }
        .version-update-btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .version-update-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        .version-update-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .version-update-btn-secondary {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .version-update-btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .version-update-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="version-update-overlay">
        <div className="version-update-modal">
          <div className="version-update-icon">🚀</div>
          <h2 className="version-update-title">Nueva versión disponible</h2>
          <p className="version-update-subtitle">
            Hay una actualización disponible para mejorar tu experiencia
          </p>

          <div className="version-update-version">
            <div className="version-update-version-label">Nueva versión</div>
            <div className="version-update-version-number">
              v{newVersion.version}
            </div>
          </div>

          {newVersion.changelog && (
            <div className="version-update-changelog">
              💡 {newVersion.changelog}
            </div>
          )}

          <div className="version-update-actions">
            <button
              className="version-update-btn version-update-btn-secondary"
              onClick={dismissUpdate}
              disabled={isUpdating}
            >
              Más tarde
            </button>
            <button
              className="version-update-btn version-update-btn-primary"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="version-update-spinner" />
                  Actualizando...
                </>
              ) : (
                "Actualizar ahora"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
