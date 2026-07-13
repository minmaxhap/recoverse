import { createApp } from 'vue'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import '@fontsource/gowun-batang/400.css'
import '@fontsource/gowun-batang/700.css'
import './style.css'
import App from './App.vue'
import { initThemePreference } from './composables/useThemePreference'

initThemePreference()
createApp(App).mount('#app')
