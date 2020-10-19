<template>
    <div>
        <v-card class="mb-2">
            <v-card-title>{{message.name}}</v-card-title>
            <v-card-text>
                <v-chip v-for="topic in topics" :key="topic.id" class="mr-2">{{topic.name}}</v-chip>
            </v-card-text>
            <v-card-text>
                {{message.text}}
            </v-card-text>
            <v-card-actions>
                <v-btn color="red" outlined small @click.prevent.stop="deleteMessage">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="green" @click.prevent.stop="gotoMessageEdit" :loading="isLoading">
                    <v-icon>mdi-pencil-outline</v-icon>
                    Редактировать
                </v-btn>
                <v-btn @click.stop.prevent="" small v-if="isStandalone">К списку сообщений</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
    import messageParams from "@/mixins/messageParams";
    import clone from "lodash.clone";

    export default {
        name: "ViewMessage",
        props: ['inputMessage'],
        mixins: [messageParams],
        data() {
            return {
            }
        },
        async mounted() {
            await this.updateLocalMessageData();
        },
        watch: {
            inputMessage() {
                this.updateLocalMessageData();
            }
        },
        methods: {
            async updateLocalMessageData() {
                if (this.inputMessage) {
                    this.message = clone(this.inputMessage);
                }
                else if (this.messageId) {
                    await this.loadMessage();
                }
            },
            updateMessageState() {
                if (this.isStandalone) {
                    this.message = this.$store.state.message.message;
                    this.savedMessage = clone(this.message);
                }
            },
        },
        computed: {
            messageId() {
                return this.$route.params.messageId;
            },
            isStandalone() {
                return !this.inputMessage;
            },
            topics() {
                return this.$store.getters.topicByIds(this.message.topics);
            }
        }
    }
</script>

<style scoped>

</style>