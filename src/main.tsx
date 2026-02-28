import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error boundary để bắt lỗi render
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React Error Boundary:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#fff', background: '#1e1e2e', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ed4245' }}>App Error</h1>
          <pre style={{ color: '#f38ba8', whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ color: '#a6adc8', fontSize: 12 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
