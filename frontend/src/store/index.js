import Vue from 'vue';
import Vuex from "vuex";

import topic from "./modules/topic";
import message from "@/store/modules/message";
import settings from "@/store/modules/settings";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        topic,
        message,
        settings
    },
    state: {
        appError: false
    },
    actions: {
    }
});