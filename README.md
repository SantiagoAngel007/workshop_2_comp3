# 🏋️‍♂️ Gym Management System - User Module

## 👥 Equipo de Desarrollo
* Luis Manuel Rojas Correa
* Santiago Angel Ordoñez
* Cristian Molina Vides
* Juan Camilo Corrales Osvath

## 📋 Descripción del Proyecto

📋 Descripción del Proyecto
Sistema de gestión de gimnasio desarrollado en NestJS con TypeScript. Este módulo maneja toda la funcionalidad relacionada con usuarios, autenticación, roles y permisos.

Cómo usar el método update:

PATCH http://localhost:3000/subscriptions/{id}

Headers:
•  Authorization: Bearer {admin_token}
•  Content-Type: application/json

Body (todos los campos son opcionales):
json
Nota: El campo membershipIds reemplazará todas las membresías actuales por las nuevas. Si quieres agregar una membresía sin reemplazar las existentes, usa el endpoint:

POST /subscriptions/{id}/memberships

# Despliegue - Gym API en Railway

## 📋 Contenido
1. [Información del Despliegue](#información-del-despliegue)
2. [Acceder a la Aplicación](#acceder-a-la-aplicación)
3. [Configurar Postman](#configurar-postman)
4. [Endpoints Principales](#endpoints-principales)
5. [Solución de Problemas](#solución-de-problemas)

---

## 📌 Información del Despliegue

### URL de Producción
```
https://workshop2comp3-production.up.railway.app
```

### Documentación API (Swagger)
```
https://workshop2comp3-production.up.railway.app/api-docs
```

### Tecnologías Utilizadas
- **Framework**: NestJS 11
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (Bearer Token)
- **Package Manager**: npm
- **Plataforma de Deploy**: Railway

---

## 🌐 Acceder a la Aplicación

### 1. Obtener el Dominio Público

**Opción A: Desde Railway Dashboard**
1. Ingresa a [railway.app](https://railway.app)
2. Selecciona tu proyecto **"gym-api"**
3. Click en tu servicio (el card de tu repositorio)
4. Ve a la pestaña **"Settings"**
5. Scroll hasta **"Networking"**
6. Copia el dominio público:
   ```
   https://workshop2comp3-production.up.railway.app
   ```

### 2. Verificar que la API está Activa

Abre en tu navegador:
```
https://workshop2comp3-production.up.railway.app/api-docs
```

Deberías ver la documentación interactiva de Swagger con todos los endpoints.

### 3. Comprobar Estado del Servidor

Ejecuta en terminal:
```bash
curl https://workshop2comp3-production.up.railway.app
```

Respuesta esperada:
```
Hello World!
```

---

## 📮 Configurar Postman

### Paso 1: Crear o Importar Environment

**Opción A: Crear Manualmente**

1. Abre **Postman**
2. Click en el ícono de engranaje ⚙️ (arriba a la derecha)
3. Click en **"Environments"**
4. Click en **"Create New Environment"**
5. Nombre: `Production` o `Workshop 2 - Production`
6. Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `base_url` | `https://workshop2comp3-production.up.railway.app` |
| `admin_token` | (Se llena después de login) |
| `coach_token` | (Se llena después de login) |
| `client_token` | (Se llena después de login) |
| `admin_id` | (Se llena después de login) |
| `coach_id` | (Se llena después de login) |
| `client_id` | (Se llena después de login) |

7. Click en **"Save"**

**Opción B: Importar Colección Existente**

Si tienes el archivo `.postman_collection.json`:
1. Click en **"Import"** (arriba a la izquierda)
2. Selecciona el archivo: `Postman/Workshop 2 - Gym API.postman_collection.json`
3. Click en **"Import"**
4. Postman importará automáticamente los endpoints

### Paso 2: Seleccionar el Environment

1. Arriba a la derecha, verás un dropdown
2. Selecciona tu environment: **"Production"**
3. Ahora todos tus requests usarán `{{base_url}}`

### Paso 3: Ejecutar Seed (Opcional)

Para poblar la BD con datos de prueba:

1. Ve a tu colección de Postman
2. Encuentra el endpoint: **GET** `/seed`
3. Click en **"Send"**
4. Respuesta esperada:
   ```json
   {
     "message": "SEED EXECUTED SUCCESSFULLY"
   }
   ```

Esto crea automáticamente:
- ✅ Roles: admin, coach, client, receptionist
- ✅ Usuarios: admin@example.com, coach@example.com, etc.
- ✅ Membresías: Basic, Premium, VIP

---

## 🔐 Autenticación (Login)

### Paso 1: Login como Admin

**Endpoint:**
```
POST {{base_url}}/auth/login
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "uuid-aqui",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "age": 30,
    "isActive": true,
    "roles": [{"id": "uuid", "name": "admin"}]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Paso 2: Guardar el Token en Postman

En el **Test** del endpoint de login, Postman puede guardar el token automáticamente:

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set('admin_token', jsonData.token);
    pm.environment.set('admin_id', jsonData.user.id);
    console.log('✅ Admin Token guardado');
}
```

### Paso 3: Usar el Token en Requests

En cualquier endpoint protegido, agrega el header:

**Header:**
```
Authorization: Bearer {{admin_token}}
```

Postman reemplazará automáticamente `{{admin_token}}` con el valor guardado.

---

## 📡 Endpoints Principales

### 🌱 Seed (Poblar Base de Datos)
```
GET {{base_url}}/seed
```

### 🔐 Autenticación
```
POST {{base_url}}/auth/register
POST {{base_url}}/auth/login
GET {{base_url}}/auth
GET {{base_url}}/auth/:id
PATCH {{base_url}}/auth/:id
DELETE {{base_url}}/auth/:id
```

### 👥 Usuarios
```
GET {{base_url}}/users
GET {{base_url}}/users/:id
POST {{base_url}}/users
PATCH {{base_url}}/users/:id
DELETE {{base_url}}/users/:id
```

### 🏋️ Membresías
```
GET {{base_url}}/memberships
GET {{base_url}}/memberships/:id
POST {{base_url}}/memberships
PUT {{base_url}}/memberships/:id
PATCH {{base_url}}/memberships/:id/toggle-status
DELETE {{base_url}}/memberships/:id
```

### 📋 Suscripciones
```
GET {{base_url}}/subscriptions
GET {{base_url}}/subscriptions/:id
GET {{base_url}}/subscriptions/user/:userId
POST {{base_url}}/subscriptions
POST {{base_url}}/subscriptions/:id/memberships
PATCH {{base_url}}/subscriptions/:id
DELETE {{base_url}}/subscriptions/:id
```

### ✅ Asistencias
```
POST {{base_url}}/attendances/check-in
POST {{base_url}}/attendances/check-out
GET {{base_url}}/attendances/status/:userId
GET {{base_url}}/attendances/history/:userId
GET {{base_url}}/attendances/stats/:userId
GET {{base_url}}/attendances/active
```

### 📖 Documentación Interactiva
```
GET {{base_url}}/api-docs
```

---

## 🧪 Flujo de Prueba Recomendado

### 1. Poblar Base de Datos
```
GET {{base_url}}/seed
```

### 2. Login como Admin
```
POST {{base_url}}/auth/login
Body: {"email": "admin@example.com", "password": "admin123"}
```
→ Copiar token a `{{admin_token}}`

### 3. Ver Todos los Usuarios
```
GET {{base_url}}/auth
Header: Authorization: Bearer {{admin_token}}
```

### 4. Ver Membresías
```
GET {{base_url}}/memberships
Header: Authorization: Bearer {{admin_token}}
```

### 5. Crear Nueva Membresía
```
POST {{base_url}}/memberships
Header: Authorization: Bearer {{admin_token}}
Body:
{
  "name": "Premium Plus",
  "cost": 150,
  "max_classes_assistance": 40,
  "max_gym_assistance": 60,
  "duration_months": 3,
  "status": true
}
```

---

## 🛠️ Solución de Problemas

### Error: "Connection refused"
**Solución:**
- Verifica que la URL sea: `https://workshop2comp3-production.up.railway.app`
- Asegúrate de usar HTTPS (no HTTP)
- Espera 1-2 minutos si acabas de desplegar

### Error: 401 Unauthorized
**Solución:**
- Verifica que el token no haya expirado (duración: 1 hora)
- Ejecuta login nuevamente
- Asegúrate de incluir `Bearer ` antes del token

### Error: 403 Forbidden
**Solución:**
- Verifica que tu rol tenga permisos para ese endpoint
- Admin puede acceder a todo
- Client solo puede acceder a sus propios datos

### Error: 500 Internal Server Error
**Solución:**
1. Ve a Railway Dashboard
2. Click en tu servicio
3. Ve a la pestaña **"Logs"**
4. Busca el error específico
5. Si es error de BD, ejecuta `/seed` nuevamente

### Las variables de entorno no se aplican
**Solución:**
1. En Postman, verifica que el environment esté seleccionado (arriba a la derecha)
2. Haz click en el environment y verifica que las variables estén guardadas
3. En el request, usa `{{variable}}` (con dos llaves)
4. Si aún no funciona, haz un hard refresh: `Ctrl + Shift + R`

---

## 📊 Credenciales por Defecto (Después de ejecutar /seed)

| Email | Rol | Contraseña |
|-------|-----|-----------|
| admin@example.com | admin | admin123 |
| coach@example.com | coach | coach123 |
| client@example.com | client | client123 |
| receptionist@example.com | receptionist | recep123 |

---

## 🔄 Actualizar Cambios en Producción

Cuando hagas cambios en tu código:

```bash
# 1. Commit tus cambios
git add .
git commit -m "feat: descripción del cambio"

# 2. Push a GitHub
git push origin main

# 3. Railway detecta automáticamente y redeploya
# Espera 1-2 minutos

# 4. Verifica que el deploy fue exitoso
# En Railway Dashboard → Logs
```

---

## 📞 Contacto y Soporte

Para más información, revisa:
- [Documentación oficial de NestJS](https://docs.nestjs.com)
- [Documentación de Railway](https://docs.railway.app)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs)

---

**Última actualización**: 30 de Octubre, 2025
**Versión API**: 0.1.0
