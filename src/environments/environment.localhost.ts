export const environment = {
    nameApp: 'Flowis',
    BFF: '',
    msAuth: '',
    appLogin: '/pages/login',

    /**
     * URL base de Kong inyectada en runtime via window.__env.API_BASE_URL (desde entrypoint.sh).
     * Ejemplo: http://192.168.3.10:8000
     * Sin env.js ó en desarrollo local: fallback a localhost:8000.
     */
    getBaseUrl(): string {
        const injected = (window as any).__env?.API_BASE_URL;
        if (injected) return injected.replace(/\/$/, '');
        const protocol = (window as any).__env?.HOST_PROTOCOL || 'http';
        const host     = (window as any).__env?.HOST_LAN_IP    || 'localhost';
        const port     = (window as any).__env?.PROXY_PORT || '2000';
        return `${protocol}://${host}:${port}`;
    },

    getEndpoint(path = ''): string {
        const base = environment.getBaseUrl();
        if (!path) return base;
        return `${base}/${path.replace(/^\//, '')}`;
    },

    /** URL del Portal a la que redirige tras login exitoso (inyectada desde PORTAL_URL) */
    get portalUrl(): string {
        return (window as any).__env?.PORTAL_URL
            || `${environment.getBaseUrl()}/portal`;
    },

    enableDevLogs: false
};

