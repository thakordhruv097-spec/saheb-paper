import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { RootErrorBoundary } from './components/RootErrorBoundary';
import { initTelemetry } from './services/telemetryService';

// Initialize background crash monitoring and runtime error capture
initTelemetry();

// Handle Vite dynamic chunk loading errors
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
    sessionStorage.removeItem('saheb_chunk_reload_lock');
  }, 2000);
});

// Prevent mouse wheel from inadvertently incrementing/decrementing number inputs while scrolling
document.addEventListener(
  'focusin',
  (e) => {
    const target = e.target as HTMLInputElement | null;
    if (target && target.tagName === 'INPUT' && target.type === 'number') {
      if (!target.dataset.wheelDisabled) {
        target.dataset.wheelDisabled = 'true';
        target.addEventListener(
          'wheel',
          (we) => {
            we.preventDefault();
            target.blur();
          },
          { passive: false }
        );
      }
    }
  },
  { capture: true }
);

document.addEventListener(
  'wheel',
  () => {
    const active = document.activeElement as HTMLInputElement | null;
    if (active && active.tagName === 'INPUT' && active.type === 'number') {
      active.blur();
    }
  },
  { passive: true }
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
