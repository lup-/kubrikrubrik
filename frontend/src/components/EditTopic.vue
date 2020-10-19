<template>
    <v-container class="fill-height align-start">
        <v-row align="start" justify="center" width="100%">
            <v-col>
                <v-card>
                    <v-card-title>{{isNew ? 'Новая тема' : 'Редактирование темы'}}</v-card-title>
                    <v-card-text>
                        <v-form>
                            <v-text-field v-model="topic.name" label="Название"></v-text-field>
                            <v-autocomplete
                                    v-model="topic.parents"
                                    :items="allTopics"
                                    chips
                                    deletable-chips
                                    clearable
                                    label="Родительские темы"
                                    multiple
                                    no-data-text="Тем не найдено"
                            >
                            </v-autocomplete>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn text small @click="resetTopic">Сбросить</v-btn>
                        <v-btn color="success" :loading="isSaving" @click="saveTopic">Сохранить</v-btn>
                        <v-spacer></v-spacer>
                        <v-btn @click="gotoTopicList">К списку тем</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import topicParams from "@/mixins/topicParams";

    export default {
        name: "EditTopic",
        mixins: [topicParams],
        data() {
            return {
            }
        },
        async mounted() {
            if (this.topicId) {
                await this.loadTopic();
            }
        },
        watch: {
            async topicId() {
                if (this.topicId) {
                    await this.loadTopic();
                }
                else {
                    this.topic = {};
                    this.savedTopic = {};
                }
            }
        },
        computed: {
            topicId() {
                return this.$route.params.topicId || false;
            },
            isNew() {
                return !this.topicId;
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