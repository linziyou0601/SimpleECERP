const state = () => ({
  _user: {},
})

const getters = {
  user: (state) => state._user,
}

const actions = {
  processResult({ state, commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getUser', state._user.id)
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect: 'profile' }, { root: true })
    }
  },
  getUser({ commit, dispatch }, id) {
    this.$axios
      .$get('/api/user/profile?id=' + id)
      .then(({ code, data }) => {
        if (code === 200) commit('setUser', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updateProfile({ commit, dispatch }, user) {
    this.$axios
      .$put('/api/user', user)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  uploadAvatar({ commit, dispatch }, formData) {
    this.$axios
      .$post('/api/user/profile/avatar', formData)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '上傳', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setUser(state, data) {
    state._user = data
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
