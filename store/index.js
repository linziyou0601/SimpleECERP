const cookieOptions = {
  maxAge: 10 * 60,
  samSite: 'Lax',
  secure: true,
}

const state = () => ({
  _user: null,
  _token: null,
  _alertDialog: {
    show: false,
    title: '',
    content: '',
  },
})

const getters = {
  user: (state) => state._user,
  token: (state) => state._token,
  alertDialog: (state) => state._alertDialog,
}

const actions = {
  login({ commit }, user) {
    this.$axios.$post('/api/login', user).then((response) => {
      if (response.message === 'ok') {
        const auth = response.auth
        const redirectTo = this.$cookies.get('redirect_to') || 'index'
        commit('setAuth', auth)
        this.$router.push({ name: redirectTo })
      } else {
        const data = response.data
        commit('fireAlertDialog', { title: '登入失敗', content: data })
      }
    })
  },
  logout({ commit }, unAuthRedirect) {
    this.$cookies.set('redirect_to', unAuthRedirect)
    commit('unsetAuth')
    this.$router.push({ name: 'login' })
  },
}

const mutations = {
  setAuth(state, { token, user }) {
    this.$cookies.set('user', user, cookieOptions)
    this.$cookies.set('token', token, cookieOptions)
  },
  unsetAuth(state) {
    this.$cookies.remove('user')
    this.$cookies.remove('token')
  },
  reloadAuth(state) {
    state._user = this.$cookies.get('user') || null
    state._token = this.$cookies.get('token') || null
  },
  fireAlertDialog(state, { title, content }) {
    state._alertDialog.title = title
    state._alertDialog.content = content
    state._alertDialog.show = true
  },
  fireUnAuthAlertDialog(state) {
    state._alertDialog.title = '登入憑證無效'
    state._alertDialog.content = '授權憑證過期或無效，請重新登入'
    state._alertDialog.show = true
  },
  closeAlertDialog(state) {
    state._alertDialog.title = ''
    state._alertDialog.content = ''
    state._alertDialog.show = false
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
