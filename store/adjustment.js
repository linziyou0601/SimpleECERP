const state = () => ({
  _allAdjustments: [],
  _loadingAdjustment: false,
  month: new Date().toISOString().substr(0, 7),
  monthSel: false,
})

const getters = {
  allAdjustments: (state) => state._allAdjustments,
  loadingAdjustment: (state) => state._loadingAdjustment,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllAdjustments')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', 'merchandise-adjustment', { root: true })
    }
  },
  getAllAdjustments({ commit, dispatch }) {
    commit('setLoadingAdjustment', true)
    this.$axios
      .$get('/api/merchandise/adjustment')
      .then(({ code, data }) => {
        if (code === 200) commit('setAllAdjustments', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingAdjustment', false)
      })
  },
  createAdjustment({ dispatch }, adjustment) {
    this.$axios
      .$post('/api/merchandise/adjustment', adjustment)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '新增', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  updateAdjustment({ dispatch }, adjustment) {
    this.$axios
      .$put('/api/merchandise/adjustment', adjustment)
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '修改', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
  deleteAdjustment({ dispatch }, adjustment) {
    this.$axios
      .$delete('/api/merchandise/adjustment', { data: adjustment })
      .then(({ message, result }) => {
        dispatch('processResult', { titlePrefix: '刪除', message, result })
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
  },
}

const mutations = {
  setAllAdjustments(state, data) {
    state._allAdjustments = data
  },
  setLoadingAdjustment(state, value) {
    state._loadingAdjustment = value
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
