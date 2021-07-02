const state = () => ({
  _allCarts: [],
  _loadingCart: false,
})

const getters = {
  allCarts: (state) => state._allCarts,
  loadingCart: (state) => state._loadingCart,
}

const actions = {
  processResult(
    { rootState, commit, dispatch },
    { titlePrefix, message, result }
  ) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllCarts', rootState._user.id)
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, { code, redirect, params }) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect, params }, { root: true })
    }
  },
  getAllCarts({ rootState, commit, dispatch }) {
    commit('setLoadingCart', true)
    this.$axios
      .$get('/api/cart?id=' + rootState._user.id)
      .then(({ code, data }) => {
        if (code === 200) commit('setAllCarts', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', { code, redirect: 'index' })
      })
      .finally(() => {
        commit('setLoadingCart', false)
      })
  },
  addToCart({ commit, dispatch }, data) {
    this.$axios
      .$post('/api/cart', data)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '加入', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', {
          code,
          redirect: 'product-id',
          params: { id: data.merchandiseId },
        })
      })
  },
  checkoutCart({ commit, dispatch }, data) {
    this.$axios
      .$post('/api/cart/checkout', data)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '訂購', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', { code, redirect: 'cart' })
      })
  },
  removeCart({ commit, dispatch }, data) {
    this.$axios
      .$delete('/api/cart/', { data })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '移除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', { code, redirect: 'cart' })
      })
  },
  resetCart({ commit, dispatch }, data) {
    this.$axios
      .$delete('/api/cart/reset', { data })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '清空', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', { code, redirect: 'cart' })
      })
  },
}

const mutations = {
  setAllCarts(state, data) {
    state._allCarts = data
  },
  setLoadingCart(state, value) {
    state._loadingCart = value
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
