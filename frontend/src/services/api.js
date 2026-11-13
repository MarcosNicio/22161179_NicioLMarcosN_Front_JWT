import { auth, logout } from '../stores/auth'

const BASE = import.meta.env.VITE_API_URL || ''

// Cliente HTTP: agrega el Bearer token y cierra sesión si el backend responde 401.
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) logout('Tu sesión expiró')
  if (!res.ok) throw Object.assign(new Error(data.message || 'Error inesperado'), { status: res.status })
  return data
}
