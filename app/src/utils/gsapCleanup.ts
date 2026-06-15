import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 全局清理所有GSAP动画和ScrollTrigger实例
// 注意: unmount 阶段 throw 错会触发 ErrorBoundary 整页重渲染, 任何清理代码必须 try/catch
export function killAllGsap() {
  try {
    // 杀死所有ScrollTrigger实例
    ScrollTrigger.getAll().forEach((st) => {
      try { st.kill(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
  try {
    // 清除全局时间线
    gsap.globalTimeline.clear();
  } catch { /* ignore */ }
  try {
    // 杀死所有tweens
    gsap.killTweensOf('*');
  } catch { /* ignore */ }
}
