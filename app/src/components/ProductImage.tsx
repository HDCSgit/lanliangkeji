import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  /** 宽高比,例如 '4/3'、'1/1'、'16/9';为 undefined 时使用默认的 h-40 等 className */
  aspectRatio?: string;
  /** 自定义 className 覆盖 */
  className?: string;
  /** img 标签 className */
  imgClassName?: string;
  /** 懒加载:默认 true,只有进入视口才加载 */
  lazy?: boolean;
  /** 失败时显示的占位文字 */
  fallbackText?: string;
  /** 高优先级(首屏大图),关闭懒加载 */
  priority?: boolean;
  /** 期望的尺寸提示,用于 srcset 自适应 */
  sizeHint?: 'thumb' | 'medium' | 'large';
}

/**
 * 把 medium/large URL 转换为指定尺寸的 URL,实现"列表用 thumb,详情用 medium/large"。
 * 例:/uploads/products/medium/abc.webp + sizeHint='thumb' -> /uploads/products/thumb/abc.webp
 */
function pickSizedUrl(src: string | undefined, hint: 'thumb' | 'medium' | 'large' = 'medium'): string | undefined {
  if (!src) return src;
  // 已经是 thumb 不变
  if (hint === 'thumb' && src.includes('/medium/')) return src.replace('/medium/', '/thumb/');
  if (hint === 'thumb' && src.includes('/large/')) return src.replace('/large/', '/thumb/');
  if (hint === 'large' && src.includes('/medium/')) return src.replace('/medium/', '/large/');
  if (hint === 'large' && src.includes('/thumb/')) return src.replace('/thumb/', '/large/');
  return src;
}

/**
 * 产品图片加载优化组件(带宽优化版):
 * - 进入视口前显示骨架屏占位(渐变动画)
 * - 进入视口后才设置 src,触发加载
 * - 加载中:模糊 + 半透明
 * - 加载完:清晰 + 淡入(opacity 0→1,blur 8px→0)
 * - 失败:显示 SVG 占位图(本地),不破图
 * - 自带 aspect-ratio 防止 layout shift
 * - 自动按 sizeHint 选择 thumb/medium/large 尺寸(后端已生成多尺寸 WebP)
 */
const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  aspectRatio,
  className = '',
  imgClassName = '',
  lazy = true,
  fallbackText = '暂无图片',
  priority = false,
  sizeHint = 'medium',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // 选中合适尺寸的 URL
  const sizedSrc = pickSizedUrl(src, sizeHint);

  // IntersectionObserver 进入视口才加载
  useEffect(() => {
    if (!lazy || priority || isInView) return;
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // src 改变时重置加载状态
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [sizedSrc]);

  const showRealImage = isInView && !!sizedSrc && !error;
  const aspectStyle = aspectRatio ? { aspectRatio } : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gradient-to-br from-ocean-foam via-white to-ocean-foam ${className}`}
      style={aspectStyle}
    >
      {/* 骨架屏动画层 - 始终存在,加载完成后会盖住 */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-shimmer" />
      )}

      {/* 失败占位 */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
          <ImageIcon className="w-10 h-10 mb-1" />
          <span className="text-xs">{fallbackText}</span>
        </div>
      )}

      {/* 空 src 也显示占位 */}
      {!src && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
          <ImageIcon className="w-10 h-10 mb-1" />
          <span className="text-xs">{fallbackText}</span>
        </div>
      )}

      {/* 真实图片 */}
      {showRealImage && (
        <img
          src={sizedSrc}
          alt={alt}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
};

export default ProductImage;
