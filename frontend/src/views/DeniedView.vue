<script setup>
import { auth } from '../stores/auth'
</script>

<template>
  <main class="page">
    <h1 class="page__title">Sin acceso</h1>
    <p class="muted">
      El rol «{{ auth.user?.role }}» no tiene permisos para esta sección.
      Pide a un administrador que revise tu cuenta.
    </p>
  </main>
</template>
