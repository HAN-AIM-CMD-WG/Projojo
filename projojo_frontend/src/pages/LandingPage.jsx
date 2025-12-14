import { Link } from "react-router-dom";

/**
 * Landing Page - First impression for students
 * Neumorphic design matching the rest of the application
 */
export default function LandingPage() {
    const features = [
        {
            icon: "work",
            title: "Echte Projecten",
            description: "Werk aan projecten van échte bedrijven en bouw je portfolio op met praktijkervaring."
        },
        {
            icon: "psychology",
            title: "Skills Matching",
            description: "Vind projecten die passen bij jouw skills en interesses. Ontwikkel nieuwe vaardigheden."
        },
        {
            icon: "badge",
            title: "Bouw je Portfolio",
            description: "Verzamel bewijs van je kunnen en laat zien wat je waard bent aan toekomstige werkgevers."
        },
        {
            icon: "groups",
            title: "Netwerk Opbouwen",
            description: "Maak connecties met bedrijven en professionals in jouw vakgebied."
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Maak je profiel",
            description: "Voeg je skills toe en upload je CV",
            icon: "person_add"
        },
        {
            number: "02", 
            title: "Ontdek projecten",
            description: "Bekijk projecten die bij jou passen",
            icon: "explore"
        },
        {
            number: "03",
            title: "Meld je aan",
            description: "Schrijf een korte motivatie",
            icon: "send"
        },
        {
            number: "04",
            title: "Ga aan de slag",
            description: "Start met je project en groei!",
            icon: "rocket_launch"
        }
    ];

    return (
        <div className="min-h-screen bg-neu-bg">
            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 bg-neu-bg/80 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-primary">school</span>
                        </div>
                        <div>
                            <h1 className="font-extrabold text-lg text-gray-700 tracking-tight leading-none">
                                Projojo
                            </h1>
                            <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">
                                Student Hub
                            </p>
                        </div>
                    </Link>
                    
                    <Link 
                        to="/login" 
                        className="neu-btn-primary !py-2.5 !px-6 font-bold"
                    >
                        <span className="material-symbols-outlined text-lg mr-2">login</span>
                        Inloggen
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Text content */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 neu-pressed px-4 py-2 rounded-full mb-6">
                                <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                                <span className="text-sm font-semibold text-gray-600">Voor ambitieuze studenten</span>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-800 leading-tight mb-6">
                                Leer door te{" "}
                                <span className="text-primary relative">
                                    doen
                                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                                        <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30"/>
                                    </svg>
                                </span>
                            </h1>
                            
                            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                                Verbind met échte bedrijven, werk aan betekenisvolle projecten en bouw een portfolio 
                                dat je onderscheidt van de rest.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link 
                                    to="/login" 
                                    className="neu-btn-primary !py-4 !px-8 text-lg font-bold"
                                >
                                    <span className="material-symbols-outlined mr-2">rocket_launch</span>
                                    Start nu gratis
                                </Link>
                                <a 
                                    href="#hoe-het-werkt" 
                                    className="neu-btn !py-4 !px-8 text-lg font-bold"
                                >
                                    <span className="material-symbols-outlined mr-2">play_circle</span>
                                    Hoe werkt het?
                                </a>
                            </div>
                            
                            {/* Social proof */}
                            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                                <div className="flex -space-x-3">
                                    {[1,2,3,4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-sm">person</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-700">100+ studenten</p>
                                    <p className="text-sm text-gray-500">werken aan projecten</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Hero illustration */}
                        <div className="flex-1 relative">
                            <div className="neu-flat p-8 rounded-3xl relative">
                                {/* Floating cards */}
                                <div className="space-y-4">
                                    {/* Project card preview */}
                                    <div className="neu-pressed p-4 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">business</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-700">Web App Ontwikkeling</h3>
                                                <p className="text-sm text-gray-500">TechStart B.V.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">React</span>
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">TypeScript</span>
                                        </div>
                                    </div>
                                    
                                    {/* Match notification */}
                                    <div className="neu-flat p-4 rounded-2xl border-l-4 border-emerald-500">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-700">Je bent aangenomen! 🎉</p>
                                                <p className="text-sm text-gray-500">Data Analytics Project</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Skills preview */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="neu-pill-primary">Python</span>
                                        <span className="neu-pill">JavaScript</span>
                                        <span className="neu-pill">Data Analytics</span>
                                        <span className="neu-pill-primary">UI/UX Design</span>
                                    </div>
                                </div>
                                
                                {/* Decorative elements */}
                                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl"></div>
                                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="hoe-het-werkt" className="py-20 px-6 scroll-mt-24">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="neu-badge-primary mb-4 inline-block">Simpel & Snel</span>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">
                            Hoe werkt Projojo?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            In vier simpele stappen van student naar professional
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, index) => (
                            <div key={step.number} className="relative">
                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent"></div>
                                )}
                                
                                <div className="neu-flat p-6 rounded-2xl text-center h-full">
                                    <div className="relative inline-block mb-4">
                                        <div className="w-16 h-16 neu-pressed rounded-2xl flex items-center justify-center mx-auto">
                                            <span className="material-symbols-outlined text-3xl text-primary">{step.icon}</span>
                                        </div>
                                        <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {step.number}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700 mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 bg-gradient-to-b from-transparent to-primary/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="neu-badge-primary mb-4 inline-block">Voordelen</span>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">
                            Waarom Projojo?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Alles wat je nodig hebt om je carrière een vliegende start te geven
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature) => (
                            <div key={feature.title} className="neu-flat p-8 rounded-2xl group hover:shadow-lg transition-shadow duration-300">
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 neu-pressed rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                                        <span className="material-symbols-outlined text-2xl text-primary">{feature.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-700 mb-2">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="neu-flat p-10 rounded-3xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <p className="text-4xl md:text-5xl font-black text-primary mb-2">50+</p>
                                <p className="text-gray-600 font-medium">Actieve Projecten</p>
                            </div>
                            <div>
                                <p className="text-4xl md:text-5xl font-black text-primary mb-2">100+</p>
                                <p className="text-gray-600 font-medium">Studenten</p>
                            </div>
                            <div>
                                <p className="text-4xl md:text-5xl font-black text-primary mb-2">25+</p>
                                <p className="text-gray-600 font-medium">Bedrijven</p>
                            </div>
                            <div>
                                <p className="text-4xl md:text-5xl font-black text-primary mb-2">95%</p>
                                <p className="text-gray-600 font-medium">Tevreden</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
                            In samenwerking met
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {/* HAN Logo */}
                        <div className="h-12 flex items-center">
                            <img 
                                src="/han_logo.png" 
                                alt="HAN University of Applied Sciences" 
                                className="h-full object-contain"
                            />
                        </div>
                        
                        {/* Placeholder for more partner logos */}
                        <div className="neu-pressed px-8 py-4 rounded-xl">
                            <span className="text-gray-500 font-bold">Partner Logo</span>
                        </div>
                        <div className="neu-pressed px-8 py-4 rounded-xl">
                            <span className="text-gray-500 font-bold">Partner Logo</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="neu-flat p-12 rounded-3xl text-center relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-5">
                            <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl"></div>
                            <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary rounded-full blur-3xl"></div>
                        </div>
                        
                        <div className="relative z-10">
                            <span className="material-symbols-outlined text-6xl text-primary mb-6 block">rocket_launch</span>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">
                                Klaar om te beginnen?
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                                Sluit je aan bij honderden studenten die hun carrière al een boost hebben gegeven met Projojo.
                            </p>
                            <Link 
                                to="/login" 
                                className="neu-btn-primary !py-4 !px-10 text-lg font-bold inline-flex"
                            >
                                <span className="material-symbols-outlined mr-2">login</span>
                                Maak gratis een account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 px-6 border-t border-gray-200/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl text-primary">school</span>
                            </div>
                            <span className="font-bold text-gray-700">Projojo</span>
                        </div>
                        
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} Projojo. Gemaakt met ❤️ voor studenten.
                        </p>
                        
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                Privacy
                            </a>
                            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                Voorwaarden
                            </a>
                            <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
