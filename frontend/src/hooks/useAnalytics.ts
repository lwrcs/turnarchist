declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>,
    ) => void;
  }
}

export const useAnalytics = () => {
  const trackEvent = (action: string, category: string, label?: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", action, {
        event_category: category,
        event_label: label,
      });
    }
  };

  return {
    trackEvent,
    trackSocialClick: (platform: string) =>
      trackEvent("click", "social", platform),
    trackGameStart: () => trackEvent("start_game", "engagement", "play_button"),
    trackHelpAccess: () =>
      trackEvent("access_help", "engagement", "help_button"),
  };
};
