'use client';

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Bewilligung hochladen",
      description: "PDF vom Bezirksamt hochladen",
      icon: "📋"
    },
    {
      number: "02",
      title: "Rechnung hochladen",
      description: "Original-Medifox-Rechnung",
      icon: "📄"
    },
    {
      number: "03",
      title: "Automatische Analyse",
      description: "Claude extrahiert alle Daten",
      icon: "🤖"
    },
    {
      number: "04",
      title: "Prüfen & Anpassen",
      description: "Kontrolliere die Ergebnisse",
      icon: "✓"
    },
    {
      number: "05",
      title: "Download",
      description: "Korrigierte Rechnung",
      icon: "💾"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 print:hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient">
            So funktioniert's
          </h2>
          <p className="text-xl text-gray-400">
            Automatisierte Rechnungskorrektur in 5 einfachen Schritten
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="frosted-glass rounded-2xl p-6 text-center hover:scale-105 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-6xl mb-4">{step.icon}</div>
              <div className="text-sm text-cyan-400 font-mono mb-2">{step.number}</div>
              <h3 className="text-lg font-bold mb-2 text-white">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 frosted-glass rounded-2xl p-8 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Tipp</h3>
              <p className="text-gray-300">
                Beide PDFs können gleichzeitig hochgeladen werden! Claude analysiert sie parallel und befüllt automatisch alle Felder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
