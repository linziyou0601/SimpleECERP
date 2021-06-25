const state = () => ({
  _allSales: [],
  _loadingSale: false,
})

const getters = {
  allSales: (state) => state._allSales,
  loadingSale: (state) => state._loadingSale,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllSales')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', 'merchandise-sale', { root: true })
    }
  },
  getAllSales({ commit, dispatch }) {
    commit('setLoadingSale', true)
    this.$axios
      .$get('/api/merchandise/sale')
      .then(({ code, data }) => {
        if (code === 200) commit('setAllSales', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingSale', false)
      })
  },
  createSale({ dispatch }, sale) {
    this.$axios
      .$post('/api/merchandise/sale', sale)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '新增', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updateSale({ dispatch }, sale) {
    this.$axios
      .$put('/api/merchandise/sale', sale)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  deleteSale({ dispatch }, sale) {
    this.$axios
      .$delete('/api/merchandise/sale', { data: sale })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '刪除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setAllSales(state, data) {
    state._allSales = data
  },
  setLoadingSale(state, value) {
    state._loadingSale = value
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
