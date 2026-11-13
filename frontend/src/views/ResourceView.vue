<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../services/api'
import { auth } from '../stores/auth'
import { RESOURCES } from '../config/resources'

const route = useRoute()
const cfg = computed(() => RESOURCES[route.params.resource])

const rows = ref([])
const roles = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const q = ref('')
const panel = ref(null) // { mode: 'create' | 'edit', id }
const form = ref({})
const formError = ref('')
const saving = ref(false)
const pendingDelete = ref(null)

// ¿El rol actual tiene permiso para esta acción? (el backend lo valida de nuevo)
const can = (action) => (cfg.value.can?.[action] ?? cfg.value.roles).includes(auth.user?.role)

function deny(what) {
  error.value = `No tienes permisos para ${what}`
  setTimeout(() => { if (error.value.startsWith('No tienes permisos')) error.value = '' }, 3000)
}
function tryCreate() { can('create') ? openCreate() : deny('crear registros') }
function tryEdit(row) { can('edit') ? openEdit(row) : deny('editar') }
function tryDelete(row) { can('delete') ? (pendingDelete.value = row.id) : deny('eliminar') }

const roleName = computed(() => Object.fromEntries(roles.value.map((r) => [r.id, r.name])))
const filtered = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return rows.value
  return rows.value.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(t)))
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const needsRoles = cfg.value.fields.some((f) => f.optionsFrom)
    const [list, r] = await Promise.all([api(cfg.value.endpoint), needsRoles ? api('/api/v2/roles') : null])
    rows.value = list.data
    if (r) roles.value = r.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => route.params.resource, () => {
  q.value = ''
  panel.value = null
  pendingDelete.value = null
  rows.value = []
  load()
}, { immediate: true })

// La fecha de PostgreSQL llega como ISO; el input date necesita YYYY-MM-DD.
function dateOnly(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function cell(row, col) {
  const v = row[col.key]
  if (col.type === 'bool') return v ? 'activo' : 'inactivo'
  if (col.type === 'date') return dateOnly(v) || '—'
  if (col.type === 'role') return roleName.value[v] ?? v
  return v === null || v === '' ? '—' : v
}

function openCreate() {
  form.value = Object.fromEntries(cfg.value.fields.map((f) => [f.key, f.type === 'checkbox' ? true : '']))
  formError.value = ''
  panel.value = { mode: 'create' }
}

function openEdit(row) {
  form.value = Object.fromEntries(cfg.value.fields.map((f) => {
    if (f.type === 'password') return [f.key, '']
    if (f.type === 'date') return [f.key, dateOnly(row[f.key])]
    if (f.type === 'checkbox') return [f.key, !!row[f.key]]
    return [f.key, row[f.key] ?? '']
  }))
  formError.value = ''
  panel.value = { mode: 'edit', id: row.id }
}

// Arma el JSON exactamente como lo valida el backend (sin campos extra, null donde se permite).
function buildPayload() {
  const body = {}
  for (const f of cfg.value.fields) {
    let v = form.value[f.key]
    if (f.type === 'checkbox') { body[f.key] = !!v; continue }
    if (typeof v === 'string') v = v.trim()
    if (v === '' || v == null) {
      if (f.nullable) body[f.key] = null
      continue
    }
    body[f.key] = f.type === 'number' || f.type === 'select' ? Number(v) : v
  }
  return body
}

function flash(msg) {
  notice.value = msg
  setTimeout(() => (notice.value = ''), 2500)
}

async function submit() {
  saving.value = true
  formError.value = ''
  try {
    const edit = panel.value.mode === 'edit'
    await api(edit ? `${cfg.value.endpoint}/${panel.value.id}` : cfg.value.endpoint, {
      method: edit ? 'PUT' : 'POST',
      body: buildPayload(),
    })
    flash(edit ? 'Cambios guardados' : 'Registro creado')
    panel.value = null
    await load()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  try {
    await api(`${cfg.value.endpoint}/${row.id}`, { method: 'DELETE' })
    flash('Registro eliminado')
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    pendingDelete.value = null
  }
}
</script>

<template>
  <main class="page">
    <header class="head">
      <h1 class="page__title">{{ cfg.title }}</h1>
      <span class="head__count">{{ filtered.length }}/{{ rows.length }}</span>
      <input v-model="q" class="head__search" type="search" placeholder="filtrar…" />
      <button class="btn btn--solid" @click="tryCreate">+ Nuevo</button>
    </header>

    <p v-if="notice" class="notice">{{ notice }}</p>
    <p v-if="error" class="notice notice--error">{{ error }}</p>
    <p v-if="loading" class="muted">Cargando…</p>

    <div v-else class="table-wrap">
      <table v-if="filtered.length" class="table">
        <thead>
          <tr>
            <th v-for="c in cfg.columns" :key="c.key">{{ c.label }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <td v-for="c in cfg.columns" :key="c.key">
              <span v-if="c.type === 'bool'" class="state" :class="{ 'state--on': row[c.key] }">{{ cell(row, c) }}</span>
              <template v-else>{{ cell(row, c) }}</template>
            </td>
            <td class="table__actions">
              <template v-if="pendingDelete === row.id">
                ¿eliminar?
                <button class="btn btn--danger" @click="remove(row)">sí</button>
                <button class="btn" @click="pendingDelete = null">no</button>
              </template>
              <template v-else>
                <button class="btn" :class="{ 'btn--locked': !can('edit') }" :title="can('edit') ? '' : 'Sin permiso'" @click="tryEdit(row)">editar</button>
                <button class="btn btn--danger" :class="{ 'btn--locked': !can('delete') }" :title="can('delete') ? '' : 'Sin permiso'" @click="tryDelete(row)">eliminar</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="!error" class="empty">{{ rows.length ? 'Sin coincidencias.' : 'Aún no hay registros.' }}</p>
    </div>

    <template v-if="panel">
      <div class="scrim" @click="panel = null"></div>
      <aside class="panel">
        <form @submit.prevent="submit" @keydown.esc="panel = null">
          <h2 class="panel__title">{{ panel.mode === 'create' ? 'Nuevo' : `Editar #${panel.id}` }}</h2>
          <p v-if="formError" class="notice notice--error">{{ formError }}</p>

          <label v-for="f in cfg.fields" :key="f.key" class="field" :class="{ 'field--check': f.type === 'checkbox' }">
            <span class="field__label">
              {{ f.label }}<em v-if="f.hint && panel.mode === 'edit'"> — {{ f.hint }}</em>
            </span>
            <input v-if="f.type === 'checkbox'" v-model="form[f.key]" type="checkbox" />
            <textarea v-else-if="f.type === 'textarea'" v-model="form[f.key]" rows="3"></textarea>
            <select v-else-if="f.type === 'select'" v-model="form[f.key]" required>
              <option value="" disabled>Selecciona…</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <input
              v-else
              v-model="form[f.key]"
              :type="f.type"
              :maxlength="f.max"
              :minlength="f.type === 'password' ? 8 : undefined"
              :min="f.type === 'number' ? 1 : undefined"
              :required="f.required || (f.requiredOnCreate && panel.mode === 'create')"
              :autocomplete="f.type === 'password' ? 'new-password' : 'off'"
            />
          </label>

          <div class="panel__actions">
            <button class="btn btn--solid" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
            <button type="button" class="btn" @click="panel = null">cancelar</button>
          </div>
        </form>
      </aside>
    </template>
  </main>
</template>
