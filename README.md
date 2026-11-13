# Backend for Students + Frontend (Vue 3)

Panel de administración en **Vue 3** que consume el servicio de `backend_base` (Node + Express + PostgreSQL).
Incluye **inicio de sesión con token (JWT)**, **verificación de sesión**, **permisos por rol** y un **CRUD interactivo** de empleados, usuarios y roles.

## Estructura

```
.
├── backend_base/      # API (Express + PostgreSQL + JWT)
├── frontend/          # Interfaz (Vue 3 + Vite + Vue Router)
└── package.json       # Raíz: instala y arranca todo con un solo comando
```

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [PostgreSQL](https://www.postgresql.org/) instalado y corriendo
- Git

## Instalación

```bash
git clone https://github.com/MarcosNicio/22161179_NicioLMarcosN_Front_Permisos_CRUD.git
cd 22161179_NicioLMarcosN_Front_Permisos_CRUD
npm install
```

Un solo `npm install` en la raíz instala las dependencias del backend y del frontend.

## Configuración

### 1. Variables de entorno

Crea el archivo `.env` del backend a partir del ejemplo:

```bash
# Linux / macOS
cp backend_base/.env.example backend_base/.env

# Windows (PowerShell)
Copy-Item backend_base/.env.example backend_base/.env
```

Edita `backend_base/.env`:

```env
NODE_ENV=development
PORT=3000
SERVICE_NAME=first microservice
URL_DB=postgresql://postgres:TU_PASSWORD@localhost:5432/backend_for_students
DB_SSL=false
JWT_SECRET=PEGA_AQUI_UN_SECRETO_DE_AL_MENOS_32_CARACTERES
```

| Variable | Descripción |
|---|---|
| `URL_DB` | Cadena de conexión a PostgreSQL. Si la contraseña tiene símbolos (`@`, `#`), codifícalos (`@` → `%40`). |
| `DB_SSL` | Ponlo en `false` para una base local. |
| `JWT_SECRET` | Mínimo 32 caracteres. Genera uno con el comando de abajo. |

Generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Base de datos

Crea la base y las tablas (los roles `admin`, `manager` y `cashier` se insertan automáticamente):

```bash
createdb -U postgres backend_for_students
psql -U postgres -d backend_for_students -f backend_base/src/database/data_base.sql
```

También puedes ejecutar `backend_base/src/database/data_base.sql` desde el Query Tool de pgAdmin.

### 3. Usuario administrador

El script crea el usuario `admin` (o restablece su contraseña si ya existe). Debe ejecutarse **desde `backend_base`** para que lea el `.env`:

```bash
cd backend_base
node src/database/seed-admin.js
cd ..
```

| Usuario | Contraseña |
|---|---|
| `admin` | `Admin12345` |

> Es una contraseña de prueba. Cámbiala si el proyecto sale de tu equipo local.

## Ejecución

Desde la raíz del repo:

```bash
npm start
```

Esto levanta ambos servicios a la vez:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Documentación (Swagger) | http://localhost:3000/api-docs |

Abre el frontend e inicia sesión con `admin` / `Admin12345`.

## Autenticación y permisos

- El login (`POST /api/v1/auth/login`) devuelve un **token JWT** que dura **15 minutos**.
- El token se guarda en `sessionStorage` y se envía en cada petición como `Authorization: Bearer <token>`.
- Al recargar la página, el frontend **verifica el token** con `GET /api/v1/auth/me`. Si es inválido o caducó, se cierra la sesión.
- Los permisos se validan **en el frontend y en el backend**, así que el backend rechaza (403) cualquier acción no permitida aunque se intente saltar la interfaz.

| Rol | Pestañas visibles | Crear | Editar / Eliminar |
|---|---|---|---|
| `admin` | Empleados, Usuarios, Roles | Sí | Sí |
| `manager` | Empleados | Sí | Botones visibles, sin permiso |
| `cashier` | Empleados | Botón visible, sin permiso | Botones visibles, sin permiso |

## Uso del CRUD

- **Ver:** cada pestaña lista los registros en una tabla.
- **Filtrar:** el campo de búsqueda filtra la tabla al escribir.
- **Crear:** botón **+ Nuevo**, llena el formulario y guarda.
- **Editar:** botón **editar** en la fila. Al editar un usuario, deja la contraseña vacía para no cambiarla.
- **Eliminar:** botón **eliminar** y confirma con **sí**.

> Cada empleado se asocia a un usuario existente (`ID de usuario`), y un usuario solo puede tener un empleado. Para crear un empleado nuevo, crea primero su usuario en la pestaña **Usuarios**.

## Estructura del frontend

```
frontend/src/
├── config/resources.js   # Define cada recurso: endpoint, columnas, campos y permisos
├── stores/auth.js        # Sesión: login, verificación, logout y expiración del token
├── services/api.js       # Cliente HTTP con el token en cada petición
├── router/index.js       # Rutas protegidas por sesión y por rol
├── views/                # Login, CRUD genérico y pantalla de "Sin acceso"
└── styles/               # CSS separado: base.css, login.css, resource.css
```

Para agregar otro CRUD basta con añadir una entrada en `config/resources.js`.

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `password authentication failed` | Usuario o contraseña incorrectos en `URL_DB`. |
| `database "..." does not exist` | Falta crear la base (`createdb`). |
| `ECONNREFUSED` | PostgreSQL no está corriendo. |
| `does not support SSL` | Falta `DB_SSL=false` en el `.env`. |
| `relation "users" does not exist` | Faltan las tablas: ejecuta `data_base.sql`. |
| `null value in column "role_id"` | Falta el rol `admin` en la tabla `roles`: ejecuta `data_base.sql` o inserta el rol. |
| Login: "Credenciales incorrectas o cuenta no disponible" | El usuario no existe, la contraseña es incorrecta, o la cuenta está bloqueada (5 intentos fallidos = 15 min). Ejecuta de nuevo `seed-admin.js`. |
| El backend se cae al arrancar | Revisa que `JWT_SECRET` exista y tenga al menos 32 caracteres. |
| "Ya existe un empleado asociado a ese usuario" | Ese usuario ya tiene empleado, o el contador de ids quedó desfasado. |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm install` | Instala backend y frontend (desde la raíz). |
| `npm start` / `npm run dev` | Arranca API y frontend a la vez. |
| `npm run build -w frontend` | Genera el frontend para producción en `frontend/dist`. |

Para producción, define `VITE_API_URL` (ver `frontend/.env.example`) con la URL del backend antes de hacer el build.

## Licencia

ISC. Backend base: Luis Angel Zaragoza Farrera.
