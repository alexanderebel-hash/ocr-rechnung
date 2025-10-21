'use client';

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden hero-gradient">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        <div className="gradient-orb gradient-orb-3" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-fade-in">
        <div className="flex justify-center mb-8">
          <img
            src="/Head-Logo.png"
            alt="DomusVita Logo"
            className="h-24 sm:h-32 lg:h-40 w-auto object-contain animate-scale-in drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))' }}
          />
        </div>
        <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          KI-gestützte Rechnungskorrektur für Berliner Pflegedienste
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-premium-gradient px-8 py-4 rounded-2xl text-white font-semibold text-lg">
            PDF hochladen
          </button>
          <button className="frosted-glass px-8 py-4 rounded-2xl text-white font-semibold text-lg hover:scale-105 transition-transform duration-300">
            Demo ansehen
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-cyan-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}
