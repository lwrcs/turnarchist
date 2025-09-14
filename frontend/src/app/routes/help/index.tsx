import { PageLayout } from "@/components/layout";
import { Link } from "react-router-dom";

const InstructionsSection = () => (
  <div className="w-full gap-y-4">
    <h1 className="text-xl sm:text-2xl mt-16 mb-10 leading-tight font-bold">
      Instructions
    </h1>
    <div className="text-sm sm:text-base w-full flex flex-col items-center justify-center gap-y-4">
      <p>Turnarchist is a turn-based game, like chess!</p>
      <p>
        Monsters only move when you do, so take your time deciding what to do
        next.
      </p>
      <p>
        Turnarchist is a roguelike, which means:
        <br />
        <span className="bg-black text-primary font-bold italic">
          All progress is lost upon death.
        </span>
      </p>
    </div>
  </div>
);

const ControlsSection = () => (
  <div className="w-full gap-y-4">
    <h1 className="text-xl sm:text-2xl mt-16 mb-10 leading-tight font-bold">
      Controls
    </h1>
    <div className="text-sm sm:text-base w-full flex flex-col items-center justify-center gap-y-4">
      <p>
        Movement and Attacking:{" "}
        <span className="bg-black text-primary font-bold">Arrow Keys</span> or{" "}
        <span className="bg-black text-primary font-bold">WASD</span>
      </p>
      <p>
        Inventory: <span className="bg-black text-primary font-bold">I</span> or
        Clicking Inventory in the bottom right
      </p>
      <p>
        Using and Equipping items:{" "}
        <span className="bg-black text-primary font-bold">Space Bar</span> or{" "}
        <span className="bg-black text-primary font-bold">Left Mouse</span>
      </p>
      <p>
        Drop Item: <span className="bg-black text-primary font-bold">Q</span> or
        dragging outside of the inventory
      </p>
      <p>
        Zoom in or out:{" "}
        <span className="bg-black text-primary font-bold">+</span> or{" "}
        <span className="bg-black text-primary font-bold">-</span>
      </p>
    </div>
  </div>
);

const HelpPage = () => {
  return (
    <PageLayout showFooter={false} title="Help">
      <div className="max-w-[90%] lg:max-w-7xl mx-auto px-5 mb-10">
        <InstructionsSection />
        <ControlsSection />
        <Link
          to="/play"
          className="inline-block px-5 py-5 mt-12 text-sm font-bold no-underline bg-primary text-gray-800 rounded-sm transition-all duration-300 hover:bg-white hover:scale-105 leading-tight"
        >
          I'm ready to play!
        </Link>
      </div>
    </PageLayout>
  );
};

export default HelpPage;
