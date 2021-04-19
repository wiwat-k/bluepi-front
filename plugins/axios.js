export default function ({store, app: { $axios, $cookies }, redirect}) {
  // { $axios, redirect }

  $axios.setBaseURL(store.state.apiUrl)
  $axios.onRequest((config) => {
    // console.log('--------------')
    // console.log('Making request to ' + config.url)
    if (store.state.user !== undefined && store.state.user !== null) {
      config.headers.common.Accept = 'application/json'
      //config.headers.common.Authorization = store.state.user.token
      config.withCredentials = false
    }
  })


  $axios.onResponse((response) => {
    // console.log('onResponse')
    // console.log(response.status, response.data.data)
    if (parseInt(response.status) === 401) {
      // console.log('dispatch logout')
      $cookies.remove('user')
      store.commit('set_user',null)
      redirect('/login')
    }

  })

  $axios.onError(error => {
    const errorCode = parseInt(error.response.status)
    if (errorCode === 401) {
      $cookies.remove('user')
      store.commit('set_user',null)
      redirect('/login')
    }
    if (errorCode === 500) {
      redirect('/error/error_server')
    }
    if (errorCode === 422) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    }
  })
}
