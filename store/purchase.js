const state = () => ({
  _allPurchases: [],
  _loadingPurchase: false,
  month: new Date().toISOString().substr(0, 7),
  monthSel: false,
})

const getters = {
  allPurchases: (state) => state._allPurchases,
  loadingPurchase: (state) => state._loadingPurchase,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllPurchases')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect: 'merchandise-purchase' }, { root: true })
    }
  },
  getAllPurchases({ state, commit, dispatch }) {
    commit('setLoadingPurchase', true)
    this.$axios
      .$get('/api/merchandise/purchase?month=' + state.month)
      .then(({ code, data }) => {
        if (code === 200) commit('setAllPurchases', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingPurchase', false)
      })
  },
  createPurchase({ dispatch }, purchase) {
    this.$axios
      .$post('/api/merchandise/purchase', purchase)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '新增', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updatePurchase({ dispatch }, purchase) {
    this.$axios
      .$put('/api/merchandise/purchase', purchase)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  deletePurchase({ dispatch }, purchase) {
    this.$axios
      .$delete('/api/merchandise/purchase', { data: purchase })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '刪除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setAllPurchases(state, data) {
    state._allPurchases = data
  },
  setLoadingPurchase(state, value) {
    state._loadingPurchase = value
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
