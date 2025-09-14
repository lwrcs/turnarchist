import { LoadingScreen } from "@/components/ui/loader";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const HomePage = lazy(() => import("./home"));
const HelpPage = lazy(() => import("./help"));
const PlayPage = lazy(() => import("./play"));

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
