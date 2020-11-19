<template>
    <v-container class="fill-height align-start">
        <v-row align="start" justify="center" width="100%">
            <v-col>
                <v-card>
                    <v-card-title>Опубликовать новый пост</v-card-title>
                    <v-card-text>
                        <v-text-field v-model="name" label="Название поста для бота"></v-text-field>
                        <v-autocomplete
                                v-model="topics"
                                :items="allTopics"
                                chips
                                deletable-chips
                                clearable
                                label="Темы"
                                multiple
                                no-data-text="Тем не найдено"
                        >
                        </v-autocomplete>
                        <v-textarea
                                v-model="text"
                                label="Текст поста"
                                :counter="image && image.length && !asLink > 0 ? 1024 : 4096"
                        ></v-textarea>
                        <v-checkbox
                                v-model="asLink"
                                label="Прикрепить изображение как ссылку"
                                v-if="image && image.length === 1"
                        ></v-checkbox>
                        <v-file-input
                                v-model="image"
                                multiple
                                chips
                                clearable
                                label="Прикрепить картинки"
                        ></v-file-input>
                        <v-checkbox
                                v-model="useButton"
                                label="Прикрепить кнопку"
                        ></v-checkbox>
                        <v-textarea
                                v-model="buttonMessage"
                                label="Текст сообщения для подписчиков"
                                v-if="useButton"
                        ></v-textarea>
                        <v-text-field v-model="buttonText" label="Текст на кнопке" v-if="useButton"></v-text-field>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn @click="sendMessage" color="green" :disabled="text.length === 0"><v-icon>mdi-telegram</v-icon>Отправить</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        name: "MessageForm",
        data() {
            return {
                topics: [],
                name: '',
                text: '',
                messageLink: '',
                image: null,
                existing: false,
                asLink: false,
                useButton: false,
                buttonText: '',
                buttonMessage: '',
            }
        },
        methods: {
            async sendMessage() {
                await this.$store.dispatch('sendMessage', {
                    topics: this.topics,
                    messageLink: this.existing ? this.messageLink : false,
                    text: this.existing ? false : this.text,
                    name: this.name,
                    image: this.image,
                    asLink: this.image && this.image.length === 1 ? this.asLink : false,
                    buttonText: this.useButton ? this.buttonText : false,
                    buttonMessage: this.useButton ? this.buttonMessage : false,
                });
                this.resetForm();
            },
            resetForm() {
                this.topics = [];
                this.text = '';
                this.name = '';
                this.image = null;
                this.asLink = false;
                this.buttonText = '';
                this.buttonMessage = '';
            }
        },
        computed: {
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