# Configuración del Proxy - app-login-erp-seis

## Problema Original
CORS policy error al intentar conectar desde localhost:4200 directamente a los microservicios en 192.168.3.30

## Solución Implementada

### Proxy de Desarrollo (proxy.conf.json)
Configurado para desarrollo local con pathRewrite que elimina el prefijo `/api/*`:

```json
{
  "/api/auth": {
    "target": "http://192.168.3.30:2000",
    "pathRewrite": { "^/api/auth": "" }
  },
  "/api/core": {
    "target": "http://192.168.3.30:2001",
    "pathRewrite": { "^/api/core": "" }
  },
  "/api/bff": {
    "target": "http://192.168.3.30:2002",
    "pathRewrite": { "^/api/bff": "" }
  }
}
```

### Flujo de Peticiones

#### Frontend → Backend
```
Usuario en navegador (localhost:4200)
   ↓ Hace petición a /api/auth/security/authenticate
   ↓
Angular Dev Server (proxy intercepta)
   ↓ pathRewrite elimina /api/auth
   ↓ Envía a http://192.168.3.30:2000/security/authenticate
   ↓
ms-auth responde
```

### Mapeo de Rutas

| Frontend                              | Proxy Reescribe a                         | Backend Endpoint              |
|---------------------------------------|-------------------------------------------|-------------------------------|
| `/api/auth/security/authenticate`     | `http://192.168.3.30:2000/security/authenticate` | ms-auth                       |
| `/api/core/factura-manager/list`      | `http://192.168.3.30:2001/factura-manager/list`  | ms-core                       |
| `/api/bff/facturas/marketplace`       | `http://192.168.3.30:2002/facturas/marketplace`  | bff_seis_app                  |

### Verificación

#### Build exitoso
```bash
cd /home/seba/Documents/Proyectos/SEIS_APP/FRONTEND/app-login-erp-seis
npm run build
# ✅ Build completo - 518.22 kB (warnings de budget son informativos)
```

#### Backend ms-auth responde correctamente
```bash
curl http://192.168.3.30:2000/security/authenticate -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'
# ✅ Respuesta: {"message":"La contraseña es obligatoria"}
```

#### Backend services running
```
✅ ms-auth: 192.168.3.30:2000
✅ ms-core: 192.168.3.30:2001
✅ BFF:     192.168.3.30:2002
```

### Uso

#### Desarrollo local con proxy
```bash
npm start
# Levanta en localhost:4200 con proxy automático
```

#### Sin proxy (directo)
```bash
npm run start:no-proxy
# ⚠️ Causará errores CORS - solo para debugging del proxy
```

### Producción (Docker)

Ver `proxy.conf.docker.json` - apunta todo a Apisix (192.168.3.10:8000) que hace el routing interno.

## Estado: ✅ VERIFICADO

- [x] Build exitoso
- [x] JSON válido
- [x] pathRewrite correcto
- [x] Backends accesibles
- [x] CORS configurado en ms-auth
