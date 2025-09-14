import { PageLayout } from "@/components/layout";
import { useRegisterGameServiceWorker } from "@/hooks/useRegisterGameServiceWorker";
import { useEffect, useRef } from "react";

export const PlayPage = () => {
  //   useRegisterGameServiceWorker();

  const gameLoadedRef = useRef(false);

  useEffect(() => {
    // Lazy load the game
    const loadGame = async () => {
      if (gameLoadedRef.current) return;
      gameLoadedRef.current = true;

      try {
        console.log("Loading game...");
        // Dynamic import of the game module
        const { game: GameInstance } = await import("@/game/game");
        console.log("Game instance loaded:", GameInstance);
        GameInstance.loadGame();
      } catch (error) {
        console.error("Failed to load game:", error);
      }
    };

    loadGame();
  }, []);

  return (
    <PageLayout showFooter={false} showHeader={false} title="Turnarchist">
      <link rel="stylesheet" type="text/css" href="style.css" />
      <canvas id="gameCanvas" width="272" height="272" />
    </PageLayout>
  );
};

export default PlayPage;
