import Vue from 'vue';
import Vuex from "vuex";
import topic from "./modules/topic";
import message from "@/store/modules/message";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        topic,
        message,
    },
    state: {
        appError: false
    },
    actions: {
    }
});