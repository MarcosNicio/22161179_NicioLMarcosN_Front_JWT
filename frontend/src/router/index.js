import { createRouter, createWebHistory } from 'vue-router'
import { auth, verify } from '../stores/auth'
import { RESOURCES } from '../config/resources'
import LoginView from '../views/LoginView.vue'
import ResourceView from '../views/ResourceView.vue'
import DeniedView from '../views/DeniedView.vue'

const firstAllowed = () =>
  Object.keys(RESOURCES).find((k) => RESOURCES[k].roles.includes(auth.user?.role))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/denied', name: 'denied', component: DeniedView },
    {
      path: '/',
      component: { render: () => null },
      beforeEnter: () => (firstAllowed() ? `/${firstAllowed()}` : '/denied'),
    },
    { path: '/:resource(employees|users|roles)', name: 'resource', component: ResourceView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Autenticación (¿hay token válido?) y autorización (¿su rol puede ver este recurso?).
router.beforeEach(async (to) => {
  if (to.meta.public) return auth.token ? '/' : true
  if (!auth.token) return { name: 'login' }
  if (!auth.verified && !(await verify())) return { name: 'login' }
  if (to.params.resource && !RESOURCES[to.params.resource].roles.includes(auth.user.role)) {
    return { name: 'denied' }
  }
  return true
})

export default router
