export const environment = {
    nameApp: 'Flowis',
    BFF: '',
    msAuth: '',
    appLogin: '/pages/login',

    /**
     * URL base de Kong inyectada en runtime via window.__env.API_BASE_URL (desde entrypoint.sh).
     * Ejemplo: http://192.168.3.10:8000
     * Sin env.js: mismo origen que la página (gateway).
     */
    getBaseUrl(): string {
        const injected = (window as any).__env?.API_BASE_URL;
        if (injected) return injected.replace(/\/$/, '');
        // Por defecto mismo origen: login, portal y APIs cuelgan del mismo gateway (APISIX), así no hay CORS.
        return window.location.origin;
    },

    getEndpoint(path = ''): string {
        const base = environment.getBaseUrl();
        if (!path) return base;
        return `${base}/${path.replace(/^\//, '')}`;
    },

    /** URL del Portal a la que redirige tras login exitoso (inyectada desde PORTAL_URL) */
    get portalUrl(): string {
        return (window as any).__env?.PORTAL_URL
            || 'http://localhost:4200'; // portal con hot reload (ng serve)
    },

    enableDevLogs: false
};

