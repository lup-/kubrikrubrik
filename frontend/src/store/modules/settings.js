import axios from "axios";

export default {
    state: {
        settings: {},
    },
    actions: {
        async loadSettings({commit}) {
            let response = await axios.get(`/api/settings`);
            return commit('setSettings', response.data.settings);
        },
        async saveSettings({commit}, settings) {
            let response = await axios.post(`/api/settings`, {settings});
            return commit('setSettings', response.data.settings);
        },
    },
    mutations: {
        setSettings(state, settings) {
            state.settings = settings || {};
        },
    }
}