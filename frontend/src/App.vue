<template>
    <v-app id="kubrikrubrikbot">
        <v-navigation-drawer v-model="drawer" app clipped>
            <v-list dense>
                <v-list-item link @click="$router.push({name: 'sendMessage'})" :disabled="$route.name === 'sendMessage'">
                    <v-list-item-action>
                        <v-icon>mdi-telegram</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Новое сообщение</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item  @click="$router.push({name: 'listTopics'})" :disabled="$route.name === 'listGroups'">
                    <v-list-item-action>
                        <v-icon>mdi-account-multiple</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Список рубрик</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item  @click="$router.push({name: 'listMessages'})" :disabled="$route.name === 'listMessages'">
                    <v-list-item-action>
                        <v-icon>mdi-account-multiple</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Список сообщений</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item  @click="$router.push({name: 'editSettings'})" :disabled="$route.name === 'editSettings'">
                    <v-list-item-action>
                        <v-icon>mdi-cog</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Настройки</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app clipped-left>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
            <v-toolbar-title>Кубрик Рубрик</v-toolbar-title>
        </v-app-bar>

        <v-main>
            <router-view></router-view>
        </v-main>

        <v-footer app>
        </v-footer>
    </v-app>
</template>

<script>
export default {
    name: 'App',
    data: () => ({
        drawer: null,
    }),
    mounted() {
        this.$store.dispatch('loadAllTopics');
        this.$store.dispatch('loadAllMessages');
    }
};
</script>
