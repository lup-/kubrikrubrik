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
                        <v-textarea v-model="text" label="Текст поста"></v-textarea>
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
            }
        },
        methods: {
            async sendMessage() {
                await this.$store.dispatch('sendMessage', {topics: this.topics, text: this.text, name: this.name});
                this.resetForm();
            },
            resetForm() {
                this.topics = [];
                this.text = '';
                this.name = '';
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