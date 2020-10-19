<template>
    <v-container class="fill-height" fluid :class="{'align-start': !isEmpty && !isLoading}">
        <v-row :align="isEmpty || isLoading ? 'center' : 'start'" :justify="isEmpty || isLoading ? 'center' : 'start'">
            <v-progress-circular v-if="isLoading"
                :size="70"
                :width="7"
                indeterminate
            ></v-progress-circular>

            <v-col cols="12" class="text-center" v-if="isEmpty && !isLoading">Тем не найдено</v-col>
            <v-col cols="3" v-if="!isEmpty">
                <v-treeview
                    :items="topicsTree"
                    :active.sync="selectedTopics"
                    activatable
                    dense
                    hoverable
                    return-object
                ></v-treeview>
            </v-col>
            <v-col cols="9" v-if="!isEmpty">
                <view-topic :input-topic="selectedTopics[0]" v-if="selectedTopics && selectedTopics.length > 0" :key="selectedTopics[0].id"></view-topic>
            </v-col>
        </v-row>
        <v-btn
            color="primary"
            elevation="2"
            fixed
            bottom
            right
            fab
            @click="$router.push({name: 'newTopic'})"
        ><v-icon>mdi-plus</v-icon></v-btn>
    </v-container>
</template>

<script>
    import ViewTopic from "@/components/ViewTopic";
    import topicParams from "@/mixins/topicParams";

    export default {
        name: "ListTopics",
        components: {ViewTopic},
        mixins: [topicParams],
        data() {
            return {
                isLoading: false,
                selectedTopics: [],
            }
        },
        async mounted() {
            await this.loadAllTopics();
        },
        methods: {
            async loadAllTopics() {
                this.isLoading = true;
                await this.$store.dispatch('loadTopics', {});
                this.isLoading = false;
            }
        },
        computed: {
            topics() {
                return this.isLoading ? [] : this.$store.state.topic.topics;
            },
            topicsTree() {
                return this.isLoading ? [] : this.$store.state.topic.topicsTree;
            },
            isEmpty() {
                return this.topics.length === 0 && this.isLoading === false;
            }
        }
    }
</script>

<style scoped>

</style>