const state = () => ({
  _allUsers: [],
  _loadingUser: false,
})

const getters = {
  allUsers: (state) => state._allUsers,
  loadingUser: (state) => state._loadingUser,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllUsers')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect: 'user' }, { root: true })
    }
  },
  getAllUsers({ commit, dispatch }) {
    commit('setLoadingUser', true)
    this.$axios
      .$get('/api/user')
      .then(({ code, data }) => {
        if (code === 200) commit('setAllUsers', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingUser', false)
      })
  },
  createUser({ dispatch }, user) {
    this.$axios
      .$post('/api/user', user)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '新增', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updateUser({ dispatch }, user) {
    this.$axios
      .$put('/api/user', user)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  deleteUser({ dispatch }, user) {
    this.$axios
      .$delete('/api/user', { data: user })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '刪除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setAllUsers(state, data) {
    state._allUsers = data
  },
  setLoadingUser(state, value) {
    state._loadingUser = value
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
