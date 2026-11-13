<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, logout } from './stores/auth'
import { RESOURCES } from './config/resources'

const route = useRoute()
const router = useRouter()

const links = computed(() =>
  Object.entries(RESOURCES).filter(([, r]) => r.roles.includes(auth.user?.role))
)

// Si el token se pierde o caduca estando dentro, regresa al login.
watch(() => auth.token, (t) => {
  if (!t && !route.meta.public) router.push({ name: 'login' })
})
</script>

<template>
  <header v-if="auth.token" class="bar">
    <span class="bar__brand">bfs</span>
    <nav class="bar__nav">
      <RouterLink v-for="[key, r] in links" :key="key" :to="`/${key}`" class="bar__link">
        {{ r.title }}
      </RouterLink>
    </nav>
    <span class="bar__user">
      {{ auth.user?.username }} · {{ auth.user?.role }}
      <button class="btn" @click="logout()">salir</button>
    </span>
  </header>
  <RouterView />
</template>
