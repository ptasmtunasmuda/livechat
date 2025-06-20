import './bootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

// Create Vue app
const app = createApp(App);

// Install plugins
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Mount the app
app.mount('#app');

// Initialize auth store
import { useAuthStore } from './stores/auth';
const authStore = useAuthStore();
authStore.initialize();
