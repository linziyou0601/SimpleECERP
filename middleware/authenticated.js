const exceptRoutes = ['index', 'product-id']
const customerRoutes = [
  'index',
  'product-id',
  'cart',
  'myOrder',
  'login',
  'profile',
]
export default function ({ app, store, redirect, route }) {
  store.commit('reloadAuth')
  const token = store.getters.token
  const user = store.getters.user
  const routeName = route.name
  const routeParams = route.params
  const scopeFlag = customerRoutes.includes(routeName) || user.scope === 'admin'
  if (
    !exceptRoutes.includes(routeName) &&
    !token &&
    routeName !== 'login' &&
    scopeFlag
  ) {
    app.$cookies.set('redirect_to', routeName)
    app.$cookies.set('params', routeParams)
    return redirect('/login')
  } else if ((token && routeName === 'login') || !scopeFlag) {
    return redirect('/')
  }
}
