import { SOCIAL_LINKS } from "./constants";
import { useAnalytics } from "@/hooks/useAnalytics";
import { GAME_VERSION } from "./constants";
import HeroVideoWebM from "@/assets/hero/hero.webm";
import HeroVideoMP4 from "@/assets/hero/hero.mp4";
import { PageLayout } from "@/components/layout";
import { Link } from "react-router-dom";

const HeroSection = () => (
  <div className="relative w-full h-[35vh] flex items-center justify-center">
    <video
      className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      autoPlay
      loop
      muted
    >
      <source src={HeroVideoWebM} type="video/webm" />
      <source src={HeroVideoMP4} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div className="text-white text-xl text-center drop-shadow-[2px_2px_10px_rgba(0,0,0,0.7)] max-w-[90%]">
      <p className="mb-1">Explore never-ending dungeons in your web browser!</p>
      <p className="text-sm">Open Alpha v{GAME_VERSION}</p>
    </div>
  </div>
);

const SocialMediaLinks = () => {
  const { trackSocialClick } = useAnalytics();

  return (
    <div className="flex flex-wrap justify-center items-center mt-20 px-5 w-full gap-x-7 gap-y-4">
      {SOCIAL_LINKS.map(({ name, url, className, label, text }) => (
        <div key={name} className="flex mx-1 mb-2.5">
          <a
            href={url}
            className={`inline-block px-3 py-[10px] text-[10px] font-bold no-underline transition-all duration-300 hover:scale-105 ${className}`}
            onClick={() => trackSocialClick(label)}
          >
            {text}
          </a>
        </div>
      ))}
    </div>
  );
};

const HomePage = () => {
  const { trackGameStart, trackHelpAccess } = useAnalytics();

  return (
    <PageLayout>
      <h1 className="text-2xl mt-12 mb-10 leading-tight font-bold">
        Welcome To Turnarchist
      </h1>
      <HeroSection />
      <div>
        <h1 className="text-2xl mt-20 mb-10 leading-tight font-bold">
          Links to play
        </h1>
        <div className="flex flex-col sm:flex-row gap-x-14 items-center justify-center mt-12 gap-y-8">
          <Link
            to="/play"
            className="px-5 py-5 h-18 w-68 text-[13px] font-bold no-underline bg-primary text-gray-800 rounded-sm transition-all duration-300 hover:bg-white hover:scale-105 leading-tight inline-flex flex-col gap-y-1"
            onClick={trackGameStart}
          >
            Play now!
            <br />
            <span className="text-[10px]">I know what I'm doing.</span>
          </Link>
          <Link
            to="/help"
            className="px-5 py-5 h-18 w-68 text-[13px] font-bold no-underline bg-primary text-gray-800 rounded-sm transition-all duration-300 hover:bg-white hover:scale-105 leading-tight inline-flex items-center justify-center"
            onClick={trackHelpAccess}
          >
            I'm new here...
          </Link>
        </div>
      </div>
      <SocialMediaLinks />
    </PageLayout>
  );
};

export default HomePage;
