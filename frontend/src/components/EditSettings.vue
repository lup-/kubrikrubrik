<template>
    <v-container class="fill-height align-start">
        <v-row align="start" justify="center" width="100%">
            <v-col>
                <v-card>
                    <v-card-title>Настройки</v-card-title>
                    <v-card-subtitle>Чтобы применить настройки, скомандовать боту `/reload`</v-card-subtitle>
                    <v-card-text>
                        <div v-for="setting in settings" :key="setting.code">
                            <v-textarea v-if="setting.type === 'text'"
                                    v-model="settingValues[setting.code]"
                                    :label="setting.title"
                                    :hint="setting.hint || ''"
                            ></v-textarea>
                            <v-text-field v-else
                                    v-model="settingValues[setting.code]"
                                    :label="setting.title"
                                    :hint="setting.hint || ''"
                            ></v-text-field>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn text small @click="resetForm">Сбросить</v-btn>
                        <v-spacer></v-spacer>
                        <v-btn @click="saveSettings" color="green"><v-icon>mdi-save</v-icon>Сохранить</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        name: "EditSettings",
        data() {
            return {
                settingValues: {},
                settings: [
                    {title: 'Сколько столбцов с кнопками категорий', code: 'buttonColumns'},
                    {title: 'Текст кнопки "Домой"', code: 'homeButtonText', hint: 'Картинки для кнопок: https://apps.timwhitlock.info/emoji/tables/unicode'},
                    {title: 'Текст кнопки ссылок в категории', code: 'linksButtonText'},
                    {title: 'Текст кнопки случайного поста', code: 'randomButtonText'},
                    {title: 'Текст кнопки возврата назад', code: 'backButtonText', hint: "Пока не актуально"},
                    {title: 'Текст кнопки поиска', code: 'searchButtonText'},
                    {title: 'Ответ об успешной перезагрузке настроек', code: 'reloadMessage', type: 'text'},
                    {title: 'Сообщение на домашнем экране', code: 'homeMessage', type: 'text'},
                    {title: 'Сообщение на экране рубрики', code: 'topicMessage', type: 'text', hint: "Можно использовать %id%, %name%"},
                    {title: 'Сообщение, что постов нет', code: 'notFoundMessage', type: 'text'},
                    {title: 'Начало списка постов', code: 'postsListMessage', type: 'text'},
                    {title: 'Ряд в списке постов', code: 'postsListRowMessage', type: 'text', hint: "Можно использовать %id%, %telegramId%, %chatId%, %name%, %text%, %url%"},
                    {title: 'Пост со случайным сообщением', code: 'randomPostMessage', type: 'text', hint: "Можно использовать %id%, %telegramId%, %chatId%, %name%, %text%, %url%"},
                    {title: 'Поск с объяснениями про поиск', code: 'searchMessage', type: 'text'},
                    {title: 'Сообщение секретной кнопки всем, кто не подписан', code: 'notSubscribed', type: 'text'},
                    {title: 'Сообщение об ошибке', code: 'errorMessage', type: 'text'},
                ]
            }
        },
        async mounted() {
            await this.loadSettings();
        },
        methods: {
            resetForm() {
                this.settingValues = this.storedSettings;
            },
            async saveSettings() {
                await this.$store.dispatch('saveSettings', this.settingValues);
                this.resetForm();
            },
            async loadSettings() {
                await this.$store.dispatch('loadSettings');
                this.resetForm();
            },
        },
        computed: {
            storedSettings() {
                return this.$store.state.settings.settings;
            }
        }
    }
</script>

<style scoped>

</style>