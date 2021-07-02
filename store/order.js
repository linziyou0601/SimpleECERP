const state = () => ({
  _allOrders: [],
  _loadingOrder: false,
  month: new Date().toISOString().substr(0, 7),
  monthSel: false,
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
      dispatch('logout', { redirect: 'order' }, { root: true })
    }
  },
  getMyOrders({ rootState, state, commit, dispatch }) {
    commit('setLoadingOrder', true)
    this.$axios
      .$get(
        '/api/order/myOrder?id=' + rootState._user.id + '&month=' + state.month
      )
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
  getAllOrders({ state, commit, dispatch }) {
    commit('setLoadingOrder', true)
    this.$axios
      .$get('/api/order?month=' + state.month)
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
        dispatch('processResult', { titlePrefix: '操作', message, result })
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
  setMonth(state, value) {
    state.month = value
  },
  setMonthSel(state, value) {
    state.monthSel = value
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
