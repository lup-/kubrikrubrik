<template>
    <v-container class="fill-height align-start">
        <v-row align="start" justify="center" width="100%">
            <v-col>
                <view-topic :input-topic="inputTopic"></view-topic>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import ViewTopic from "@/components/ViewTopic";

    export default {
        name: "ViewTopicStandalone",
        components: {ViewTopic},
        props: ['inputTopic'],
    }
</script>

<style scoped>

</style>