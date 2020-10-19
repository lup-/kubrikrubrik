import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import routes from "@/routes";
import vuetify from './plugins/vuetify';
import store from "@/store";

const router = new VueRouter({
  routes
});

Vue.config.productionTip = false;

Vue.use(VueRouter);

new Vue({
  store,
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')