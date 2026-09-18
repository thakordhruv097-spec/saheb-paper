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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
