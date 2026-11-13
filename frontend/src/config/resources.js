// Describe cada recurso del backend: endpoint, roles con acceso, columnas y campos del formulario.
// Para agregar otro CRUD basta con añadir una entrada aquí.
export const RESOURCES = {
  employees: {
    title: 'Empleados',
    endpoint: '/api/v2/employees',
    roles: ['admin', 'manager', 'cashier'],
    // Quién puede cada acción (si no se indica, se usa "roles"). El manager ve los botones pero no tiene permiso.
    can: { create: ['admin', 'manager'], edit: ['admin'], delete: ['admin'] },
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'first_name', label: 'Nombre' },
      { key: 'last_name', label: 'Apellido' },
      { key: 'job_title', label: 'Puesto' },
      { key: 'hired_at', label: 'Ingreso', type: 'date' },
      { key: 'is_active', label: 'Estado', type: 'bool' },
    ],
    fields: [
      { key: 'user_id', label: 'ID de usuario', type: 'number', required: true },
      { key: 'first_name', label: 'Nombre', type: 'text', required: true, max: 100 },
      { key: 'last_name', label: 'Apellido', type: 'text', required: true, max: 100 },
      { key: 'phone', label: 'Teléfono', type: 'text', nullable: true, max: 20 },
      { key: 'address', label: 'Dirección', type: 'textarea', nullable: true },
      { key: 'job_title', label: 'Puesto', type: 'text', nullable: true, max: 60 },
      { key: 'hired_at', label: 'Fecha de ingreso', type: 'date' },
      { key: 'is_active', label: 'Activo', type: 'checkbox' },
    ],
  },
  users: {
    title: 'Usuarios',
    endpoint: '/api/v2/usuarios',
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'username', label: 'Usuario' },
      { key: 'email', label: 'Correo' },
      { key: 'role_id', label: 'Rol', type: 'role' },
      { key: 'is_active', label: 'Estado', type: 'bool' },
    ],
    fields: [
      { key: 'username', label: 'Usuario', type: 'text', required: true, max: 30 },
      { key: 'email', label: 'Correo', type: 'email', required: true, max: 254 },
      { key: 'password', label: 'Contraseña', type: 'password', requiredOnCreate: true, hint: 'vacía = no cambiar' },
      { key: 'role_id', label: 'Rol', type: 'select', required: true, optionsFrom: 'roles' },
      { key: 'is_active', label: 'Activo', type: 'checkbox' },
    ],
  },
  roles: {
    title: 'Roles',
    endpoint: '/api/v2/roles',
    roles: ['admin'],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, max: 30 },
      { key: 'description', label: 'Descripción', type: 'textarea', nullable: true },
    ],
  },
}
