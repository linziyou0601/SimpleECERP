const state = () => ({
  _allReports: [],
  _loadingReport: false,
  month: new Date().toISOString().substr(0, 7),
  monthSel: false,
})

const getters = {
  allReports: (state) => state._allReports,
  loadingReport: (state) => state._loadingReport,
}

const actions = {
  processResult({ commit, dispatch }, { titlePrefix, message, result }) {
    const alertDialog = { title: titlePrefix, content: result }
    if (message === 'ok') {
      dispatch('getAllReports')
      alertDialog.title += '成功'
    } else {
      alertDialog.title += '失敗'
    }
    commit('fireAlertDialog', alertDialog, { root: true })
  },
  processError({ commit, dispatch }, code) {
    if (code === 401 || code === 403) {
      commit('fireUnAuthAlertDialog', null, { root: true })
      dispatch('logout', { redirect: 'report' }, { root: true })
    }
  },
  getAllReports({ state, commit, dispatch }) {
    commit('setLoadingReport', true)
    this.$axios
      .$get('/api/report?month=' + state.month)
      .then(({ code, data }) => {
        if (code === 200) commit('setAllReports', data)
      })
      .catch(({ response, code = response.status || null }) => {
        dispatch('processError', code)
      })
      .finally(() => {
        commit('setLoadingReport', false)
      })
  },
}

const mutations = {
  setAllReports(state, data) {
    state._allReports = data
  },
  setLoadingReport(state, value) {
    state._loadingReport = value
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
