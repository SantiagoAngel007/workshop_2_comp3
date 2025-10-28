# Railway Deployment Guide

## Quick Setup

### 1. Preparación Local
```bash
# Instalar dependencias
bun install

# Verificar que todo compila
bun run build

# Correr tests
bun run test
```

### 2. Variables de Entorno Necesarias

En Railway Dashboard → tu servicio → Variables:
```bash
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<generar_secreto_seguro>
NODE_ENV=production
```

### 3. Crear PostgreSQL en Railway

1. New → Database → PostgreSQL
2. Esperar ~2 minutos
3. Copiar credenciales

### 4. Deploy
```bash
git add .
git commit -m "feat: configure Railway deployment"
git push origin main
```

Railway detectará automáticamente los cambios y desplegará.

### 5. Post-Deploy
```bash
# Ejecutar seed
curl https://tu-app.up.railway.app/seed

# Probar login
curl -X POST https://tu-app.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Troubleshooting

### Error: "Application failed to respond"
- Verificar que `main.ts` usa `app.listen(port, '0.0.0.0')`
- Verificar variables de entorno

### Error: "Database connection failed"
- Verificar que SSL está habilitado en `app.module.ts`
- Verificar credenciales de BD

### Error: "Port already in use"
- Verificar que usas `process.env.PORT`