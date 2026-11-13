<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, login } from '../stores/auth'

const router = useRouter()
const identifier = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await login(identifier.value.trim(), password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="login">
    <form class="login__form" @submit.prevent="submit">
      <h1 class="login__title">Iniciar sesión</h1>
      <p v-if="auth.reason && !error" class="notice">{{ auth.reason }}</p>
      <p v-if="error" class="notice notice--error">{{ error }}</p>
      <label class="field">
        <span class="field__label">Usuario o correo</span>
        <input v-model="identifier" autocomplete="username" required autofocus />
      </label>
      <label class="field">
        <span class="field__label">Contraseña</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <button class="btn btn--solid" :disabled="busy">{{ busy ? 'Entrando…' : 'Entrar' }}</button>
    </form>
  </main>
</template>
