<template>
    <div>
        <v-card @click.native="gotoTopicDetails">
            <v-card-title>
                {{topic.name}}
            </v-card-title>
            <v-card-text v-if="isStandalone">
                <v-chip v-for="parent in parents" :key="parent.id" class="mr-2">{{parent.name}}</v-chip>
            </v-card-text>

            <v-card-actions>
                <v-btn color="red" outlined small @click.prevent.stop="deleteTopic">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="green" @click.prevent.stop="gotoTopicEdit" :loading="isLoading">
                    <v-icon>mdi-pencil-outline</v-icon>
                    Редактировать
                </v-btn>
                <v-btn @click.stop.prevent="gotoTopicList" small v-if="isStandalone">К списку тем</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
    import topicParams from "@/mixins/topicParams";
    import clone from "lodash.clone";

    export default {
        name: "ViewTopic",
        props: ['inputTopic'],
        mixins: [topicParams],
        data() {
            return {
            }
        },
        async mounted() {
            await this.updateLocalTopicData();
        },
        watch: {
            inputTopic() {
                this.updateLocalTopicData();
            }
        },
        methods: {
            async updateLocalTopicData() {
                if (this.inputTopic) {
                    this.topic = clone(this.inputTopic);
                }
                else if (this.topicId) {
                    await this.loadTopic();
                }
            },
            updateTopicState() {
                if (this.isStandalone) {
                    this.topic = this.$store.state.topic.topic;
                    this.savedTopic = clone(this.topic);
                }
            },
        },
        computed: {
            topicId() {
                return this.$route.params.topicId;
            },
            isStandalone() {
                return !this.inputTopic;
            },
            parents() {
                return this.$store.getters.topicByIds( this.topic.parents );
            }
        }
    }
</script>

<style scoped>

</style>