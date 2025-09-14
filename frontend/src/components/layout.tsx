import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";

interface PageLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
  title?: string;
}

export const PageLayout = ({
  children,
  showFooter = true,
  showHeader = true,
  title = "Turnarchist",
}: PageLayoutProps) => {
  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      {showHeader && (
        <header className="w-full bg-black/80 pt-6 text-center text-base">
          <h2 className="p-4 relative">Turnarchist</h2>
        </header>
      )}
      {children}
      {showFooter && (
        <footer className="mt-12 text-xs opacity-70 mb-12 leading-6">
          © 2025 Turnarchist. All rights reserved.
        </footer>
      )}
    </div>
  );
};
