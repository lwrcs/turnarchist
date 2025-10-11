import { ReactNode } from "react";

interface LoadingScreenProps {
  message?: string;
  children?: ReactNode;
}

export const LoadingScreen = ({ message, children }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="relative">
        {/* Spinner animation */}
        <div className="h-16 w-16 rounded-full border-t-2 border-l-2 border-primary animate-spin"></div>

        {/* Optional pulsing ring effect */}
        <div className="absolute inset-0 rounded-full border border-primary/30 animate-pulse"></div>
        <div className="absolute -inset-4 rounded-full border border-primary/10 animate-pulse animation-delay-300"></div>
      </div>
      {/* Loading message with subtle animation */}
      <p className="mt-6 text-zinc-400 animate-pulse">{message}</p>
      {/* Optional additional content */}
      {children}
    </div>
  );
};
