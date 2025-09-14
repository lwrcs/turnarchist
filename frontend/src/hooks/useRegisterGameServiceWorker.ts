import { useEffect } from "react";

export const useRegisterGameServiceWorker = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service worker registered successfully");
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    }
  }, []);
};
