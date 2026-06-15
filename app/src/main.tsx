import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// 全局错误处理 - 防止GSAP等第三方库错误导致应用崩
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error);
  // 如果是GSAP相关错误，阻止默认行为
  if (e.message && (e.message.includes('closest') || e.message.includes('gsap') || e.message.includes('trigger'))) {
    e.preventDefault();
    console.warn('GSAP error suppressed');
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  if (e.reason && String(e.reason).includes('closest')) {
    e.preventDefault();
    console.warn('GSAP rejection suppressed');
  }
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
