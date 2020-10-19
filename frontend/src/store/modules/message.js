import axios from "axios";

export default {
    state: {
        filter: false,
        message: false,
        messages: [],
        allMessages: [],
    },
    actions: {
        async loadMessage({commit}, messageId) {
            let response = await axios.get(`/api/message/${messageId}`);

            return commit('setMessage', response.data.message);
        },
        async loadMessages({commit}, filter) {
            commit('setFilter', filter);
            let response = await axios.post(`/api/message/list`, {filter});
            return commit('setMessages', response.data.messages);
        },
        async loadAllMessages({commit}) {
            let response = await axios.post(`/api/message/list`, {});
            return commit('setAllMessages', response.data.messages);
        },
        async reloadMessages({dispatch, state}) {
            if (state.messages) {
                await dispatch('loadMessages', state.filter);
            }

            if (state.message) {
                await dispatch('loadMessage', state.message.id);
            }
        },
        async saveMessage({commit, dispatch}, message) {
            let response = await axios.post(`/api/message`, {message});
            await commit('setMessage', response.data.message);
            return dispatch('loadAllMessages');
        },
        async deleteMessage({commit, state, dispatch}, message) {
            await axios.post(`/api/message/delete`, {id: message.id});

            if (state.message.id === message.id) {
                return commit('setMessage', false);
            }

            return dispatch('reloadMessages');
        },

        async sendMessage({commit, dispatch}, {topics, text, name}) {
            let response = await axios.post(`/api/message/send`, {topics, text, name});
            await commit('setMessage', response.data.message);
            return dispatch('loadAllMessages');
        }
    },
    getters: {
        messagesByTopicIds(state) {
            return topicIds => {
                if (!topicIds) {
                    topicIds = [];
                }

                return state.allMessages.filter(message => {
                    let messageTopics = message.topics || [];
                    let intersectIds = messageTopics.filter(topicId => topicIds.includes(topicId));

                    return intersectIds.length > 0;
                });
            }
        },
    },
    mutations: {
        setFilter(state, filter) {
            state.filter = filter || false;
        },
        setMessage(state, message) {
            state.message = message || false;
        },
        setMessages(state, messages) {
            state.messages = messages || [];
        },
        setAllMessages(state, messages) {
            state.allMessages = messages || [];
        },
    }
}