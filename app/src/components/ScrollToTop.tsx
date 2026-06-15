import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { killAllGsap } from '@/utils/gsapCleanup';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 路由切换时清理所有GSAP实例，防止ScrollTrigger崩溃
    killAllGsap();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
