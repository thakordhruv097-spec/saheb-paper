import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Handle Vite dynamic chunk loading errors (e.g. after a new deployment when old chunk hashes are invalidated)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Preload error detected (likely new version deployed). Reloading page...', event);
  const reloadKey = 'saheb_vite_preload_reloaded';
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, 'true');
    window.location.reload();
  }
});

// Clear the reload flag on successful load so future deployments can reload again
window.addEventListener('load', () => {
  setTimeout(() => {
    sessionStorage.removeItem('saheb_vite_preload_reloaded');
    sessionStorage.removeItem('saheb_chunk_error_reloaded');
  }, 2000);
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Auto-recover from dynamic import failures caused by new deployments
    const msg = (error?.message || '').toLowerCase();
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('importing a module script failed') ||
      msg.includes('loading chunk') ||
      msg.includes('error loading dynamically imported')
    ) {
      const reloadKey = 'saheb_chunk_error_reloaded';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        console.warn('[ErrorBoundary] Chunk fetch failed after deployment. Auto-reloading latest bundle...');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const msg = (this.state.error?.message || '').toLowerCase();
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('failed to fetch') ||
        msg.includes('importing a module script failed') ||
        msg.includes('loading chunk');

      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1329', color: '#fff', fontFamily: 'sans-serif', padding: '20px' }}>
          <div style={{ maxWidth: '500px', background: '#131d38', padding: '30px', borderRadius: '16px', border: '1px solid #1e293b', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>
              {isChunkError ? 'System Updated' : 'Something went wrong'}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6 }}>
              {isChunkError
                ? 'A new version of Saheb Paper ERP has been published. Please click below to load the latest application.'
                : (this.state.error?.message || 'An unexpected error occurred while loading the application.')}
            </p>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{ background: '#6C4FE0', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Update &amp; Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
