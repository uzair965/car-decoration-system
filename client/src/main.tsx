import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import { initializeTheme } from './store/themeStore.ts';
import './index.css';

// Initialize theme before render to prevent flash
initializeTheme();

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      staleTime: 5 * 60 * 1000,   // Data is fresh for 5 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
