import axios from 'axios'
export default function ({ $axios, store, app, redirect }) {
  $axios.onRequest(async (config) => {
    await axios.get('/api/csrf')
    config.headers.common.Authorization = `Bearer ${store.getters.token}`
    console.log('Making request to ' + config.url)
    console.log('config: ', config)
    return config
  })
}
