<template>
    <v-container class="fill-height align-start">
        <v-row align="start" justify="center" width="100%">
            <v-col>
                <v-card>
                    <v-card-title>Редактирование поста</v-card-title>
                    <v-card-text>
                        <v-form>
                            <v-text-field v-model="message.name" label="Название поста для бота"></v-text-field>
                            <v-autocomplete
                                    v-model="message.topics"
                                    :items="allTopics"
                                    chips
                                    deletable-chips
                                    clearable
                                    label="Темы сообщения"
                                    multiple
                                    no-data-text="Тем не найдено"
                            >
                            </v-autocomplete>
                            <v-textarea v-model="message.text" label="Текст поста"></v-textarea>
                            <v-img :src="message.imageData.url" max-width="50%" v-if="hasImage"></v-img>
                            <v-file-input v-model="image" :label="hasImage ? 'Поменять картинку' : 'Прикрепить картинку'"></v-file-input>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn text small @click="resetMessage">Сбросить</v-btn>
                        <v-btn color="success" :loading="isSaving" @click="saveMessage">Сохранить</v-btn>
                        <v-spacer></v-spacer>
                        <v-btn @click="gotoMessageList">К списку сообщений</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import messageParams from "@/mixins/messageParams";

    export default {
        name: "EditMessage",
        mixins: [messageParams],
        data() {
            return {
            }
        },
        async mounted() {
            if (this.messageId) {
                await this.loadMessage();
            }
        },
        watch: {
            async topicId() {
                if (this.messageId) {
                    await this.loadMessage();
                }
                else {
                    this.message = {};
                    this.savedMessage = {};
                }
            }
        },
        computed: {
            hasImage() {
                return this.message.imageData && this.message.imageData.url;
            },
            messageId() {
                return this.$route.params.messageId || false;
            },
            isNew() {
                return !this.messageId;
            },
            allTopics() {
                let stateTopics = this.$store.state.topic.allTopics || [];
                return stateTopics.map((topic) => {
                    return {
                        text: topic.name,
                        value: topic.id,
                    };
                });
            }
        }
    }
</script>

<style scoped>

</style>