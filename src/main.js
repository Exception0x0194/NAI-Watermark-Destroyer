import App from './App.vue'
import ElementPlus from 'element-plus'
import { createApp } from 'vue'
import { useDark, useToggle } from "@vueuse/core"

import './style.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')

const isDark = useDark();
useToggle(isDark);
