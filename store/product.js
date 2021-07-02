const state = () => ({
  _allProducts: [],
  _product: {},
  _loadingProduct: false,
})

const getters = {
  allProducts: (state) => state._allProducts,
  product: (state) => state._product,
  loadingProduct: (state) => state._loadingProduct,
}

const actions = {
  processError({ commit, dispatch }, { code, redirect, params }) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect, params }, { root: true })
    }
  },
  getAllProducts({ commit, dispatch }) {
    commit('setLoadingProduct', true)
    this.$axios
      .$get('/api/merchandise/allProducts')
      .then(({ code, data }) => {
        if (code === 200) commit('setAllProducts', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', { code, redirect: 'index' })
      })
      .finally(() => {
        commit('setLoadingProduct', false)
      })
  },
  getProduct({ commit, dispatch }, id) {
    commit('setLoadingProduct', true)
    this.$axios
      .$get('/api/merchandise/product?id=' + id)
      .then(({ code, data, message }) => {
        if (code === 200 && message === 'ok') commit('setProduct', data)
        else {
          commit(
            'fireAlertDialog',
            { title: '錯誤', content: data },
            { root: true }
          )
          this.$router.push({ name: 'index' })
        }
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', {
          code,
          redirect: 'product-id',
          params: { id },
        })
      })
      .finally(() => {
        commit('setLoadingProduct', false)
      })
  },
}

const mutations = {
  setAllProducts(state, data) {
    state._allProducts = data
  },
  setLoadingProduct(state, value) {
    state._loadingProduct = value
  },
  setProduct(state, data) {
    state._product = data
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
