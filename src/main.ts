import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { createPinia } from "pinia";
import ui from "@nuxt/ui/vue-plugin";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ui);
app.mount("#app");
