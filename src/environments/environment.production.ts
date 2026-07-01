export const environment = {
    nameApp: 'Flowis',
    BFF: '/api/bff',
    msAuth: '/api/auth/security',
    // Ruta de login relativa al origen servido por Kong
    appLogin: '/pages/login',
    /**
     * Construye una URL absoluta usando window.__env (runtime) o localhost:8000 como fallback.
     * Requiere que index.html cargue assets/env-config.js con window.__env seteado.
     * Solo necesario cuando la URL debe salir del dominio actual (ej: redirecciones cross-origin).
     */
    getEndpoint(path = ''): string {
        const protocol = (window as any).__env?.HOST_PROTOCOL || 'http';
        const host = (window as any).__env?.HOST_LAN_IP;
        const port = (window as any).__env?.KONG_PROXY_PORT;
        const base = `${protocol}://${host}:${port}`;
        if (!path) return base;
        return `${base}/${path.replace(/^\//, '')}`;
    },
    getBaseUrl(): string {
        const protocol = (window as any).__env?.HOST_PROTOCOL || 'http';
        const host = (window as any).__env?.HOST_LAN_IP;
        const port = (window as any).__env?.KONG_PROXY_PORT;
        return `${protocol}://${host}:${port}`;
    },
    enableDevLogs: false
};
