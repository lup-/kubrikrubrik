import clone from "lodash.clone";

export default {
    data() {
        return {
            isSaving: false,
            isLoading: false,
            savedTopic: {},
            topic: {},
        }
    },
    methods: {
        gotoTopicList() {
            this.$router.push({name: 'listTopics'});
        },
        gotoTopicDetails() {
            this.$router.push({name: 'viewTopic', params: {topicId: this.topic.id}});
        },
        gotoTopicEdit() {
            this.$router.push({name: 'editTopic', params: {topicId: this.topic.id}});
        },
        resetTopic() {
            if (this.isNew) {
                this.topic = {};
            }
            else {
                this.topic = clone(this.savedTopic);
            }
        },
        async saveTopic() {
            this.isSaving = true;
            await this.$store.dispatch('saveTopic', this.topic);
            this.updateTopicState();
            this.isSaving = false;
            if (this.isNew) {
                let topicId = this.$store.state.topic.topic.id;
                this.$router.push({name: 'editTopic', params: {topicId}});
            }
        },
        updateTopicState() {
            this.topic = this.$store.state.topic.topic;
            this.savedTopic = clone(this.topic);
        },
        async loadTopic() {
            if (!this.topicId) {
                return;
            }
            this.isLoading = true;
            await this.$store.dispatch('loadTopic', this.topicId);
            this.isLoading = false;
            this.updateTopicState();
        },
        async deleteTopic() {
            this.isLoading = true;
            await this.$store.dispatch('deleteTopic', this.topic);
            this.isLoading = false;
            this.updateTopicState();
        }
    },
}