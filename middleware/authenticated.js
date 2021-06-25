const exceptRoutes = ['index']
export default function ({ app, store, redirect, route }) {
  store.commit('reloadAuth')
  const token = store.getters.token
  const routeName = route.name
  if (!exceptRoutes.includes(routeName) && !token && routeName !== 'login') {
    app.$cookies.set('redirect_to', routeName)
    return redirect('/login')
  } else if (token && routeName === 'login') {
    return redirect('/')
  }
}
