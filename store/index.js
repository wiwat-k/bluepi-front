export const state = () => ({
  apiUrl: process.env.API_URL,
  user: null,
})

export const mutations = {
  setUser (state, value) {
    state.user = value
  },
}

export const actions = {
  async nuxtServerInit ({ commit }) {
  },
}

