import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { MainErrorFallback } from "@/components/errors/main-error-fallback";
import { LoadingScreen } from "@/components/ui/loader";

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <ErrorBoundary fallback={MainErrorFallback}>
        <HelmetProvider>{children}</HelmetProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
