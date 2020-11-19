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
        async saveMessage({commit, dispatch}, {message, image}) {
            let requestData = new FormData();
            requestData.append('message', JSON.stringify(message) );
            requestData.append('image', image);

            let response = await axios.post( '/api/message',
                requestData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            await commit('setMessage', response.data.message);
            return dispatch('loadAllMessages');
        },
        async deleteMessage({commit, state, dispatch}, message) {
            await axios.post(`/api/message/delete`, {id: message.id});

            if (state.message.id === message.id) {
                commit('setMessage', false);
            }

            return dispatch('reloadMessages');
        },

        async sendMessage({commit, dispatch}, messageFields) {
            let requestData = new FormData();
            for (const fieldName in messageFields) {
                let fieldValue = messageFields[fieldName];
                if (fieldValue instanceof Array) {
                    for (const value of fieldValue) {
                        requestData.append(fieldName, value);
                    }
                }
                else {
                    requestData.append(fieldName, fieldValue);
                }

            }

            let response = await axios.post( '/api/message/send',
                requestData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

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
                    if ( !(messageTopics instanceof Array) ) {
                        return false;
                    }

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