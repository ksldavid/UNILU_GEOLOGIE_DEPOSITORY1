// Vercel Build Trigger - Reconnected - Force Deployment #2
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from "./App.tsx";
// import "./index.css";
import "./styles/globals.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Don't refetch automatically when switching tabs
            staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes instead of querying every 30s
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
);
