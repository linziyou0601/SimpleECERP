const state = () => ({
  _allMerchandises: [],
  _loadingMerchandise: false,
})

const getters = {
  allMerchandises: (state) => state._allMerchandises,
  loadingMerchandise: (state) => state._loadingMerchandise,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllMerchandises')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect: 'merchandise-manage' }, { root: true })
    }
  },
  getAllMerchandises({ commit, dispatch }) {
    commit('setLoadingMerchandise', true)
    this.$axios
      .$get('/api/merchandise')
      .then(({ code, data }) => {
        if (code === 200) commit('setAllMerchandises', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingMerchandise', false)
      })
  },
  createMerchandise({ dispatch }, merchandise) {
    this.$axios
      .$post('/api/merchandise', merchandise)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '新增', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updateMerchandise({ dispatch }, merchandise) {
    this.$axios
      .$put('/api/merchandise', merchandise)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  deleteMerchandise({ dispatch }, merchandise) {
    console.log(merchandise)
    this.$axios
      .$delete('/api/merchandise', { data: merchandise })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '刪除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setAllMerchandises(state, data) {
    state._allMerchandises = data
  },
  setLoadingMerchandise(state, value) {
    state._loadingMerchandise = value
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
