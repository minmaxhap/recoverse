import { createApp } from 'vue'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import '@fontsource/gowun-batang/400.css'
import '@fontsource/gowun-batang/700.css'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { initThemePreference } from './composables/useThemePreference'

initThemePreference()
const app = createApp(App)
app.use(router)
// 초기 라우트가 확정된 뒤 마운트 — 첫 화면이 리다이렉트 대상으로 곧바로 그려지게 한다.
router.isReady().then(() => app.mount('#app'))
