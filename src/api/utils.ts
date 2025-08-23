// Returns the API URL based on the environment.
// In development, it returns the local server URL.
// In production, it returns the same domain as the current page.
export const getEnvironmentApiUrl = () => {
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost") ||
    window.location.protocol === "file:";

  if (isDevelopment) {
    return "http://localhost:3000/api/v1";
  } else {
    return `${window.location.origin}/api/v1`;
  }
};
