import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";
import { i18n } from "./i18n";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ui);
app.use(i18n);
app.mount("#app");
