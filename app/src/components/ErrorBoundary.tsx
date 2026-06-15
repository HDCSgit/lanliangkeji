import { Component } from 'react';
import type { ReactNode } from 'react';
import { killAllGsap } from '@/utils/gsapCleanup';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error.message);
    // 如果是GSAP错误，清理所有GSAP实例
    if (error.message.includes('closest') || error.message.includes('trigger')) {
      console.warn('GSAP error detected, cleaning up...');
      killAllGsap();
      // 自动重试渲染
      setTimeout(() => {
        this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount > 3) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>页面加载出错</h2>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>请刷新页面重试</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#1a6fc4', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
