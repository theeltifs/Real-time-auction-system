import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const LandingPage = () => {
  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img
          src="/images/fantastic-car.png"
          alt="Fantastic Car"
          className="absolute w-full h-full object-cover brightness-[.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/60 to-blue-900/40 z-10" />
        <div className="relative z-20 text-center px-6">
          <h1
            data-aos="fade-up"
            className="text-4xl md:text-7xl font-extrabold text-white drop-shadow-2xl bg-black/30 px-4 py-3 rounded-xl backdrop-blur-sm"
          >
            Welcome to the Future of Bidding
          </h1>
          <p
            data-aos="fade-up"
            data-aos-delay="300"
            className="mt-6 text-xl md:text-2xl text-gray-300"
          >
            Own what others can only admire.
          </p>
          <a
            href="/auctions"
            data-aos="zoom-in"
            data-aos-delay="500"
            className="mt-8 inline-block bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 animate-bounce"
          >
            Start Bidding Now
          </a>
        </div>
      </section>

      <WaveDivider direction="down" />

      <Section
        img="/images/super-bike.png"
        title="Super Bike"
        description="Bid on limited-edition superbikes with raw power and futuristic design."
        reverse={false}
      />
      <Section
        img="/images/modern-house.png"
        title="Modern House"
        description="Win dream homes in stunning locations through live auctions."
        reverse={true}
      />
      <Section
        img="/images/smartphone.png"
        title="Smart Phones"
        description="Get the latest smartphones with powerful features and sleek looks."
        reverse={false}
      />

      <WaveDivider direction="up" />
    </div>
  );
};

const Section = ({ img, title, description, reverse }) => (
  <section
    className={`flex flex-col ${
      reverse ? "md:flex-row-reverse" : "md:flex-row"
    } items-center justify-center gap-16 px-8 py-24 bg-gray-900`}
  >
    <div
      className="w-full max-w-md"
      data-aos={reverse ? "fade-left" : "fade-right"}
    >
      <img
        src={img}
        alt={title}
        className="rounded-3xl shadow-xl transform hover:scale-105 transition-transform duration-500 border-4 border-purple-500/20"
      />
    </div>

    <div
      className="max-w-xl text-center md:text-left space-y-4"
      data-aos={reverse ? "fade-right" : "fade-left"}
    >
      <h2 className="text-4xl font-bold text-cyan-400 drop-shadow-lg">
        {title}
      </h2>
      <p className="text-gray-300 text-lg leading-relaxed">{description}</p>
    </div>
  </section>
);

const WaveDivider = ({ direction = "down" }) => (
  <div className="relative">
    <svg
      className={`w-full h-24 text-gray-900 ${
        direction === "up" ? "rotate-180" : ""
      }`}
      preserveAspectRatio="none"
      viewBox="0 0 1440 320"
    >
      <path
        fill="currentColor"
        d="M0,64L48,90.7C96,117,192,171,288,170.7C384,171,480,117,576,106.7C672,96,768,128,864,133.3C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      ></path>
    </svg>
  </div>
);

export default LandingPage;
