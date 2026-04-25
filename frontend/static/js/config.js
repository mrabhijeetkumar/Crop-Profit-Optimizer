(function configureApiBase() {
    const existing = window.APP_CONFIG && typeof window.APP_CONFIG.API_BASE_URL === "string"
        ? window.APP_CONFIG.API_BASE_URL.trim()
        : "";

    if (existing) {
        window.APP_CONFIG = { API_BASE_URL: existing };
        return;
    }

    const isNetlifyHost = window.location.hostname.endsWith("netlify.app");
    const fallbackBase = isNetlifyHost
        ? `${window.location.origin}/.netlify/functions/proxy`
        : "";

    window.APP_CONFIG = {
        API_BASE_URL: fallbackBase,
    };
})();
