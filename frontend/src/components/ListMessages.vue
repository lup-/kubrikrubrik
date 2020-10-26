<template>
    <v-container class="fill-height align-start" fluid>
        <v-row class="fill-height">
            <v-col cols="12" v-if="isLoading" class="d-flex fill-height align-center justify-center">
                <v-progress-circular
                        :size="70"
                        :width="7"
                        indeterminate
                ></v-progress-circular>
            </v-col>

            <v-col cols="3">
                <v-treeview
                    :items="topicsTree"
                    v-model="selectedTopics"
                    selection-type="independent"
                    selectable
                    dense
                    hoverable
                ></v-treeview>
            </v-col>
            <v-col cols="9" class="text-center d-flex fill-height align-center justify-center" v-if="isEmpty && !isLoading">Сообщений не найдено</v-col>
            <v-col cols="9" v-if="!isEmpty">
                <view-message :input-message="message" v-for="message in messages" :key="message.id"></view-message>
            </v-col>
        </v-row>
        <v-btn
            color="primary"
            elevation="2"
            fixed
            bottom
            right
            fab
            @click="gotoSendMessage"
        ><v-icon>mdi-plus</v-icon></v-btn>
    </v-container>
</template>

<script>
    import ViewMessage from "@/components/ViewMessage";
    import messageParams from "@/mixins/messageParams";

    export default {
        name: "ListMessages",
        components: {ViewMessage},
        mixins: [messageParams],
        data() {
            return {
                isLoading: false,
                selectedTopics: [],
            }
        },
        async mounted() {
            await this.loadAllMessages();
        },
        methods: {
            async loadAllMessages() {
                this.isLoading = true;
                await this.$store.dispatch('loadTopics', {});
                await this.$store.dispatch('loadMessages', {});
                this.isLoading = false;
            }
        },
        computed: {
            messages() {
                if (this.isLoading) {
                    return [];
                }

                if (this.selectedTopics.length > 0) {
                    return this.$store.getters.messagesByTopicIds(this.selectedTopics);
                }

                return this.isLoading ? [] : this.$store.state.message.messages;
            },
            topicsTree() {
                return this.isLoading ? [] : this.$store.state.topic.topicsTree;
            },
            isEmpty() {
                return this.messages.length === 0 && this.isLoading === false;
            }
        }
    }
</script>

<style scoped>

</style>