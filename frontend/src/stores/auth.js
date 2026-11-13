import { reactive } from 'vue'

const KEY = 'bfs_session'
const BASE = import.meta.env.VITE_API_URL || ''
let timer = null

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) } catch { return null }
}
const saved = read()

export const auth = reactive({
  token: saved?.token ?? null,
  user: saved?.user ?? null,
  verified: false, // ¿ya se validó el token contra /auth/me en esta carga?
  reason: '',
})

function persist() {
  sessionStorage.setItem(KEY, JSON.stringify({ token: auth.token, user: auth.user }))
}

// Lee el "exp" del JWT para cerrar la sesión justo cuando caduca (15 min en el backend).
function expiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).exp * 1000
  } catch { return 0 }
}

function schedule() {
  clearTimeout(timer)
  if (!auth.token) return
  const ms = expiry(auth.token) - Date.now()
  if (ms <= 0) return logout('Tu sesión expiró')
  timer = setTimeout(() => logout('Tu sesión expiró'), Math.min(ms, 2 ** 31 - 1))
}

export async function login(identifier, password) {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'No fue posible iniciar sesión')
  auth.token = data.accessToken
  auth.user = data.user
  auth.verified = true
  auth.reason = ''
  persist()
  schedule()
}

// Verifica que el token guardado siga siendo válido y refresca el usuario (rol incluido).
export async function verify() {
  if (!auth.token) return false
  try {
    const res = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (!res.ok) throw new Error('invalid')
    auth.user = (await res.json()).data
    auth.verified = true
    persist()
    schedule()
    return true
  } catch {
    logout('Tu sesión expiró')
    return false
  }
}

export function logout(reason = '') {
  clearTimeout(timer)
  auth.token = null
  auth.user = null
  auth.verified = false
  auth.reason = reason
  sessionStorage.removeItem(KEY)
}

schedule()
