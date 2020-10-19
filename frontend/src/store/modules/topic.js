import axios from "axios";

export default {
    state: {
        filter: false,
        topic: false,
        topics: [],
        topicsTree: [],
        allTopics: [],
    },
    actions: {
        async loadTopic({commit}, topicId) {
            let response = await axios.get(`/api/topic/${topicId}`);

            return commit('setTopic', response.data.topic);
        },
        async loadTopics({commit}, filter) {
            commit('setFilter', filter);
            let response = await axios.post(`/api/topic/list`, {filter});
            await commit('setTopics', response.data.topics);
            return commit('setTopicsTree', response.data.topicsTree);
        },
        async loadAllTopics({commit}) {
            let response = await axios.post(`/api/topic/list`, {});
            return commit('setAllTopics', response.data.topics);
        },
        async reloadTopics({dispatch, state}) {
            if (state.topics) {
                await dispatch('loadTopics', state.filter);
            }

            if (state.topic) {
                await dispatch('loadTopic', state.topic.id);
            }
        },
        async saveTopic({commit, dispatch}, topic) {
            let response = await axios.post(`/api/topic`, {topic});
            await commit('setTopic', response.data.topic);
            return dispatch('loadAllTopics');
        },
        async deleteTopic({commit, state, dispatch}, topic) {
            await axios.post(`/api/topic/delete`, {id: topic.id});

            if (state.topic.id === topic.id) {
                return commit('setTopic', false);
            }

            return dispatch('reloadTopics');
        },
    },
    getters: {
        topicByIds(state) {
            return topicIds => {
                if (!topicIds) {
                    topicIds = [];
                }
                return state.allTopics.filter(topic => topicIds.indexOf(topic.id) !== -1);
            }
        },
    },
    mutations: {
        setFilter(state, filter) {
            state.filter = filter || false;
        },
        setTopic(state, topic) {
            state.topic = topic || false;
        },
        setTopics(state, topics) {
            state.topics = topics || [];
        },
        setTopicsTree(state, topicsTree) {
            state.topicsTree = topicsTree || [];
        },
        setAllTopics(state, topics) {
            state.allTopics = topics || [];
        },
    }
}