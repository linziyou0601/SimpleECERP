const state = () => ({
  _allOrders: [],
  _loadingOrder: false,
})

const getters = {
  allOrders: (state) => state._allOrders,
  loadingOrder: (state) => state._loadingOrder,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllOrders')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', 'order', { root: true })
    }
  },
  getAllOrders({ commit, dispatch }) {
    commit('setLoadingOrder', true)
    this.$axios
      .$get('/api/order')
      .then(({ code, data }) => {
        if (code === 200) commit('setAllOrders', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingOrder', false)
      })
  },
  createOrder({ dispatch }, order) {
    this.$axios
      .$post('/api/order', order)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '新增', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updateOrder({ dispatch }, order) {
    this.$axios
      .$put('/api/order', order)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  deleteOrder({ dispatch }, order) {
    this.$axios
      .$delete('/api/order', { data: order })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '刪除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setAllOrders(state, data) {
    state._allOrders = data
  },
  setLoadingOrder(state, value) {
    state._loadingOrder = value
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
