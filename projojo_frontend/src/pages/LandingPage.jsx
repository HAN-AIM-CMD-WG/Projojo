import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import DiscoverySection from "../components/DiscoverySection";

/**
 * Modern Landing Page - Student-focused, professional, innovative
 */
export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { isDark, setTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: "work_outline",
            title: "Échte Projecten",
            description: "Werk aan projecten van bedrijven die je daadwerkelijk voorbereiden op je carrière. Geen theorie, maar praktijk.",
            color: "from-orange-400 to-rose-400"
        },
        {
            icon: "auto_awesome",
            title: "Smart Matching",
            description: "Onze AI matcht jouw skills met projecten die perfect passen bij jouw ambities en ontwikkeldoelen.",
            color: "from-violet-400 to-purple-400"
        },
        {
            icon: "workspace_premium",
            title: "Bouw je Portfolio",
            description: "Verzamel tastbaar bewijs van je kunnen. Een portfolio dat spreekt bij je volgende sollicitatie.",
            color: "from-cyan-400 to-blue-400"
        },
        {
            icon: "trending_up",
            title: "Groei als Professional",
            description: "Leer van ervaren professionals, bouw je netwerk op en ontdek waar jouw passie ligt.",
            color: "from-emerald-400 to-teal-400"
        }
    ];

    const journeySteps = [
        {
            phase: "Start",
            title: "Ontdek jezelf",
            description: "Voeg je skills toe en vertel waar je van droomt",
            icon: "explore"
        },
        {
            phase: "Match",
            title: "Vind je project",
            description: "Ontdek projecten die bij jou passen",
            icon: "favorite"
        },
        {
            phase: "Groei",
            title: "Leer door te doen",
            description: "Werk samen met professionals aan échte uitdagingen",
            icon: "rocket_launch"
        },
        {
            phase: "Succes",
            title: "Bereik je doel",
            description: "Start je carrière met een sterk portfolio",
            icon: "celebration"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neu-bg via-primary/5 to-neu-bg">
            {/* Modern Navigation */}
            <nav className={`fixed w-full z-50 top-0 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-[var(--neu-bg)]/80 backdrop-blur-xl border-b border-[var(--neu-border)] shadow-sm' 
                    : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-2xl text-white font-bold">school</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-[var(--text-primary)] tracking-tight">
                                Projojo
                            </h1>
                            <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-wider uppercase">
                                Student Hub
                            </p>
                        </div>
                    </Link>
                    
                    <div className="flex items-center gap-4">
                        <a 
                            href="#features" 
                            className="hidden md:block text-sm font-semibold text-[var(--text-secondary)] hover:text-primary transition-colors"
                        >
                            Features
                        </a>
                        <a 
                            href="#journey" 
                            className="hidden md:block text-sm font-semibold text-[var(--text-secondary)] hover:text-primary transition-colors"
                        >
                            Hoe het werkt
                        </a>
                        <Link 
                            to="/publiek" 
                            className="hidden md:block text-sm font-semibold text-[var(--text-secondary)] hover:text-primary transition-colors"
                        >
                            Ontdek projecten
                        </Link>
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-primary hover:bg-[var(--neu-bg)] transition-all"
                            aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
                        >
                            <span className="material-symbols-outlined">
                                {isDark ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        <Link 
                            to="/login" 
                            className="relative group overflow-hidden rounded-2xl px-6 py-3 font-bold text-white"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600 transition-transform group-hover:scale-105"></div>
                            <div className="relative flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">login</span>
                                <span>Inloggen</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Modern & Impactful */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-orange-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Content */}
                        <div className="space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--neu-bg)]/60 backdrop-blur-sm border border-[var(--neu-border)] shadow-lg">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-sm font-bold text-[var(--text-primary)]">Voor ambitieuze studenten</span>
                            </div>
                            
                            {/* Main Headline */}
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[1.1]">
                                    Van studie naar{" "}
                                    <span className="relative inline-block">
                                        <span className="relative z-10 bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                                            impact
                                        </span>
                                        <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                                            <path d="M2 10C50 2 150 2 198 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#FF7F50" stopOpacity="0.3"/>
                                                    <stop offset="100%" stopColor="#FF7F50" stopOpacity="0.6"/>
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </span>
                                </h1>
                                
                                <p className="text-xl md:text-2xl text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Werk aan échte projecten, bouw je portfolio en maak het verschil. 
                                    <span className="text-primary font-bold"> Leer door te doen.</span>
                                </p>
                            </div>
                            
                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link 
                                    to="/login" 
                                    className="group relative overflow-hidden rounded-2xl px-8 py-4 font-bold text-white text-lg shadow-xl hover:shadow-2xl transition-shadow"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                        <span>Start gratis</span>
                                    </div>
                                </Link>
                                
                                <a 
                                    href="#journey" 
                                    className="group px-8 py-4 rounded-2xl bg-[var(--neu-bg)]/60 backdrop-blur-sm border-2 border-[var(--neu-border)] hover:border-primary/50 font-bold text-[var(--text-primary)] text-lg transition-all hover:bg-[var(--neu-bg)]/80 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">play_circle</span>
                                    <span>Ontdek meer</span>
                                </a>
                            </div>
                            
                            {/* Social Proof */}
                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex -space-x-4">
                                    {[1,2,3,4,5].map((i) => (
                                        <div 
                                            key={i} 
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-orange-400/30 border-3 border-[var(--neu-bg)] flex items-center justify-center shadow-lg"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        >
                                            <span className="material-symbols-outlined text-primary text-lg">person</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="font-black text-[var(--text-primary)] text-lg">100+ studenten</p>
                                    <p className="text-sm text-[var(--text-muted)] font-semibold">werken al aan hun toekomst</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right: Visual */}
                        <div className="relative">
                            {/* Main Card - Project Preview */}
                            <div className="relative z-10 bg-[var(--neu-bg)]/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-[var(--neu-border)]">
                                <div className="space-y-6">
                                    {/* Project Card */}
                                    <div className="neu-flat rounded-2xl p-6 shadow-lg">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined text-white text-2xl">business</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-[var(--text-primary)] text-lg">Web Development</h3>
                                                <p className="text-sm text-[var(--text-muted)] font-semibold">TechStart B.V.</p>
                                            </div>
                                            <div className="px-3 py-1 bg-emerald-100 rounded-full">
                                                <span className="text-xs font-bold text-emerald-700">Perfect match</span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                                            Bouw een moderne web applicatie met React en TypeScript voor een innovatief tech organisatie.
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-3 py-1.5 bg-gradient-to-r from-primary to-orange-500 text-white text-xs font-bold rounded-lg shadow-sm">React</span>
                                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-lg shadow-sm">TypeScript</span>
                                            <span className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold rounded-lg shadow-sm">UI/UX</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--neu-border)]">
                                            <span className="text-xs font-bold text-[var(--text-muted)]">95% MATCH</span>
                                            <div className="h-2 flex-1 mx-4 bg-[var(--neu-shadow-dark)]/20 rounded-full overflow-hidden">
                                                <div className="h-full w-[95%] bg-gradient-to-r from-primary to-orange-500 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Success Notification */}
                                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-5 border-l-4 border-emerald-500 shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined text-white text-xl">check_circle</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-[var(--text-primary)]">Je bent aangenomen!</p>
                                                <p className="text-sm text-[var(--text-secondary)] font-medium">Start over 2 dagen met je project</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-2">
                                        <div className="px-4 py-2 neu-flat rounded-xl font-semibold text-sm text-[var(--text-primary)]">
                                            Python
                                        </div>
                                        <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-xl border border-primary/30 font-semibold text-sm text-primary">
                                            JavaScript
                                        </div>
                                        <div className="px-4 py-2 neu-flat rounded-xl font-semibold text-sm text-[var(--text-primary)]">
                                            Data Science
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Floating Elements */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center animate-float">
                                <span className="material-symbols-outlined text-white text-4xl">workspace_premium</span>
                            </div>
                            
                            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-2xl flex items-center justify-center animate-float-delayed">
                                <span className="material-symbols-outlined text-white text-3xl">trending_up</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - Modern Grid */}
            <section id="features" className="py-24 px-6 relative scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-2">
                            <span className="text-sm font-bold text-primary">Waarom Projojo?</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                            Alles voor jouw groei
                        </h2>
                        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                            De tools en begeleiding die je nodig hebt om je carrière te lanceren
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <div 
                                key={feature.title}
                                className="group relative bg-[var(--neu-bg)]/60 backdrop-blur-sm rounded-3xl p-8 border border-[var(--neu-border)] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start gap-6">
                                    <div className="relative">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                                        <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                                            <span className="material-symbols-outlined text-white text-3xl">{feature.icon}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-xl font-black text-[var(--text-primary)]">{feature.title}</h3>
                                        <p className="text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Journey Section - Visual Timeline */}
            <section id="journey" className="py-24 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-2">
                            <span className="text-sm font-bold text-primary">Jouw Journey</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                            In 4 stappen naar succes
                        </h2>
                        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                            We begeleiden je van begin tot eind
                        </p>
                    </div>
                    
                    <div className="relative">
                        {/* Timeline connector - Desktop */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-400 to-emerald-400 transform -translate-y-1/2 opacity-20"></div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {journeySteps.map((step, index) => (
                                <div key={step.phase} className="relative">
                                    <div className="bg-[var(--neu-bg)]/70 backdrop-blur-sm rounded-3xl p-8 border border-[var(--neu-border)] shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full">
                                        {/* Phase Number */}
                                        <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-white font-black text-sm">{index + 1}</span>
                                        </div>
                                        
                                        {/* Icon */}
                                        <div className="w-16 h-16 neu-pressed rounded-2xl flex items-center justify-center mb-6">
                                            <span className="material-symbols-outlined text-4xl text-primary">{step.icon}</span>
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="space-y-3">
                                            <span className="inline-block px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary uppercase tracking-wider">
                                                {step.phase}
                                            </span>
                                            <h3 className="text-xl font-black text-[var(--text-primary)]">{step.title}</h3>
                                            <p className="text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section - Modern Cards */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--neu-bg)]/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-[var(--neu-border)]">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: "50+", label: "Actieve Projecten", icon: "work" },
                                { value: "100+", label: "Studenten", icon: "group" },
                                { value: "25+", label: "Bedrijven", icon: "business" },
                                { value: "95%", label: "Tevredenheid", icon: "star" }
                            ].map((stat) => (
                                <div key={stat.label} className="text-center space-y-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-orange-400/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <span className="material-symbols-outlined text-primary text-xl">{stat.icon}</span>
                                    </div>
                                    <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                                        {stat.value}
                                    </p>
                                    <p className="text-[var(--text-secondary)] font-semibold text-sm">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs mb-6">
                            Samenwerking met
                        </p>
                    </div>
                    
                        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <div className="h-12 flex items-center filter drop-shadow-lg">
                            <img 
                                src="/han_logo.png" 
                                alt="HAN University" 
                                className="h-full object-contain"
                            />
                        </div>
                        <div className="px-8 py-4 bg-[var(--neu-bg)]/50 backdrop-blur-sm rounded-2xl border border-[var(--neu-border)]">
                            <span className="text-[var(--text-muted)] font-bold text-sm">Partner Logo</span>
                        </div>
                        <div className="px-8 py-4 bg-[var(--neu-bg)]/50 backdrop-blur-sm rounded-2xl border border-[var(--neu-border)]">
                            <span className="text-[var(--text-muted)] font-bold text-sm">Partner Logo</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Public Discovery Section */}
            <DiscoverySection />

            {/* CTA Section - Final Push */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-12 md:p-16 shadow-2xl overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                        </div>
                        
                        <div className="relative z-10 text-center space-y-6">
                            <span className="material-symbols-outlined text-7xl text-white/90">rocket_launch</span>
                            <h2 className="text-4xl md:text-5xl font-black text-white">
                                Klaar voor de volgende stap?
                            </h2>
                            <p className="text-xl text-white/90 max-w-2xl mx-auto font-medium">
                                Sluit je aan bij honderden studenten die hun carrière al een boost hebben gegeven.
                            </p>
                            <div className="pt-4">
                                <Link 
                                    to="/login" 
                                    className="inline-flex items-center gap-3 px-10 py-5 bg-white text-primary rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform"
                                >
                                    <span className="material-symbols-outlined">login</span>
                                    <span>Start nu gratis</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Clean & Modern */}
            <footer className="py-12 px-6 border-t border-[var(--neu-border)]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">school</span>
                            </div>
                            <div>
                                <span className="font-black text-[var(--text-primary)]">Projojo</span>
                                <p className="text-xs text-[var(--text-muted)]">Student Hub</p>
                            </div>
                        </div>
                        
                        <p className="text-[var(--text-muted)] text-sm font-medium">
                            © {new Date().getFullYear()} Projojo. Gemaakt met ❤️ voor studenten.
                        </p>
                        
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary transition-colors">
                                Privacy
                            </a>
                            <a href="#" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary transition-colors">
                                Voorwaarden
                            </a>
                            <a href="#" className="text-sm font-semibold text-[var(--text-muted)] hover:text-primary transition-colors">
                                Contact
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-5deg); }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-float-delayed {
                    animation: float-delayed 7s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
