# Temple Gym API

Sistema backend para gestión de gimnasio desarrollado con NestJS, TypeORM y PostgreSQL. Incluye autenticación JWT, autorización por roles, gestión de membresías, suscripciones y control de asistencias.

## Equipo de Desarrollo

- Luis Manuel Rojas Correa
- Santiago Angel Ordoñez
- Cristian Molina Vides
- Juan Camilo Corrales Osvath

## Requisitos Previos

- Node.js 18+ o Bun
- Docker y Docker Compose
- PostgreSQL 15 (o usar Docker)

## Instalación

```bash
# Instalar dependencias
bun install
```

## Configuración

1. Crear archivo `.env` en la raíz del proyecto:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=workshop_db
DB_USERNAME=admin
DB_PASSWORD=password123
JWT_SECRET=my_super_secret_key_12345
NODE_ENV=development

# Variables para Docker
POSTGRES_USER=admin
POSTGRES_PASSWORD=password123
POSTGRES_DB=workshop_db
```

2. Levantar base de datos con Docker:

```bash
docker compose up -d
```

## Ejecución

```bash
# Modo desarrollo
bun run start:dev

# Modo producción
bun run start:prod
```

La API estará disponible en `http://localhost:3000`

## Población de Datos Iniciales

```bash
# Ejecutar seed para poblar la base de datos
curl http://localhost:3000/seed
```

Esto crea:
- 4 usuarios de prueba (admin, coach, client, receptionist)
- 5 membresías de ejemplo
- Roles del sistema

**Credenciales de prueba:**
- Admin: `admin@example.com` / `admin123`
- Receptionist: `receptionist@example.com` / `recep123`
- Coach: `coach@example.com` / `coach123`
- Client: `client@example.com` / `client123`

## Testing

```bash
# Ejecutar todos los tests
bun run test:all

# Solo tests unitarios
bun run test:unit

# Solo tests E2E
bun run test:e2e
```

## Documentación API (Swagger)

Accede a la documentación interactiva en:
```
http://localhost:3000/api-docs
```

Desde Swagger puedes:
- Ver todos los endpoints disponibles
- Probar las peticiones directamente
- Ver los esquemas de datos
- Autenticarte con el token JWT

## Probar la Aplicación (Postman)

### 1. Autenticación

**Login:**
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Guarda el `token` de la respuesta para usarlo en las siguientes peticiones.

### 2. Membresías

**Ver todas las membresías:**
```bash
GET http://localhost:3000/memberships
Authorization: Bearer {token}
```

**Crear membresía:**
```bash
POST http://localhost:3000/memberships
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Premium Plus",
  "cost": 120.00,
  "max_classes_assistance": 30,
  "max_gym_assistance": 40,
  "duration_months": 1,
  "status": true
}
```

### 3. Suscripciones

**Crear suscripción para un usuario:**
```bash
POST http://localhost:3000/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "{user-uuid}"
}
```

**Agregar membresía a suscripción:**
```bash
POST http://localhost:3000/subscriptions/{subscription-id}/memberships
Authorization: Bearer {token}
Content-Type: application/json

{
  "membershipId": "{membership-uuid}"
}
```

### 4. Asistencias

**Registrar check-in:**
```bash
POST http://localhost:3000/attendances/check-in
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "{user-uuid}"
}
```

**Registrar check-out:**
```bash
POST http://localhost:3000/attendances/check-out
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "{user-uuid}"
}
```

## Colección de Postman

Importa el archivo `Postman/Workshop 2 - Gym API (Con Auth Update Logic).postman_collection.json` en Postman para tener todas las peticiones preconfiguradas.

## Roles y Permisos

- **admin:** Acceso completo al sistema
- **receptionist:** Gestión de membresías, suscripciones y asistencias
- **coach:** Consulta de información y estadísticas
- **client:** Acceso limitado a información propia

## Estructura del Proyecto

```
src/
├── auth/           # Autenticación y usuarios
├── memberships/    # Gestión de membresías
├── subscriptions/  # Gestión de suscripciones
├── attendances/    # Control de asistencias
└── seed/           # Datos iniciales
```

## Tecnologías

- NestJS
- TypeScript
- TypeORM
- PostgreSQL 15
- JWT (Passport)
- class-validator
- Swagger/OpenAPI
- Docker

## Notas Importantes

- Las membresías y suscripciones usan **soft delete** (no se eliminan físicamente)
- Un usuario solo puede tener **una suscripción activa** a la vez
- Las contraseñas se hashean con **bcrypt**
- Los IDs son **UUID** generados automáticamente

