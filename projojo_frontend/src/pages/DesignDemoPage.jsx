import { useState } from 'react';

/**
 * DesignDemoPage - Preview van het nieuwe Neumorphic Design Systeem
 * 
 * Dit is een tijdelijke pagina om het nieuwe design te testen.
 * Kan later verwijderd worden.
 */

const colorThemes = {
    han: {
        name: 'HAN Roze',
        emoji: '🩷',
        primary: '#e50056',
        primaryDark: '#cf004e',
        primaryLight: '#ff1a70',
        gradient: 'linear-gradient(135deg, #e50056 0%, #ff1a70 100%)',
        shadow: 'rgba(229, 0, 86, 0.3)',
    },
    teal: {
        name: 'Teal',
        emoji: '🌊',
        primary: '#14B8A6',
        primaryDark: '#0D9488',
        primaryLight: '#2DD4BF',
        gradient: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
        shadow: 'rgba(20, 184, 166, 0.3)',
    },
    indigo: {
        name: 'Indigo',
        emoji: '💜',
        primary: '#6366F1',
        primaryDark: '#4F46E5',
        primaryLight: '#818CF8',
        gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        shadow: 'rgba(99, 102, 241, 0.3)',
    },
    coral: {
        name: 'Coral',
        emoji: '🍊',
        primary: '#FF7F50',
        primaryDark: '#E06A3D',
        primaryLight: '#FFA07A',
        gradient: 'linear-gradient(135deg, #FF7F50 0%, #FFA07A 100%)',
        shadow: 'rgba(255, 127, 80, 0.3)',
    },
};

export default function DesignDemoPage() {
    const [activeTheme, setActiveTheme] = useState('indigo');
    const theme = colorThemes[activeTheme];

    // CSS custom properties voor dynamische kleuren
    const themeStyles = {
        '--theme-primary': theme.primary,
        '--theme-primary-dark': theme.primaryDark,
        '--theme-primary-light': theme.primaryLight,
        '--theme-gradient': theme.gradient,
        '--theme-shadow': theme.shadow,
    };

    return (
        <div className="min-h-screen bg-neu-bg p-8 lg:p-12" style={themeStyles}>
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-text-primary mb-2">
                        Neumorphic Design Systeem
                    </h1>
                    <p className="text-text-muted font-semibold">
                        Preview met {theme.emoji} {theme.name} ({theme.primary})
                    </p>
                </header>

                {/* Color Theme Picker */}
                <section className="flex justify-center">
                    <div className="neu-pressed p-2 rounded-2xl inline-flex gap-2">
                        {Object.entries(colorThemes).map(([key, t]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTheme(key)}
                                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                                    activeTheme === key 
                                        ? 'text-white shadow-lg' 
                                        : 'text-text-secondary hover:bg-white/50'
                                }`}
                                style={activeTheme === key ? { background: t.gradient } : {}}
                            >
                                <span>{t.emoji}</span>
                                <span className="hidden sm:inline">{t.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Section: Buttons */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>touch_app</span>
                        Buttons
                    </h2>
                    <div className="neu-card-lg">
                        <div className="flex flex-wrap gap-4 items-center">
                            <button 
                                className="bg-neu-bg text-text-secondary font-bold rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                                style={{ boxShadow: '5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF' }}
                                onMouseEnter={(e) => e.target.style.color = theme.primary}
                                onMouseLeave={(e) => e.target.style.color = ''}
                            >
                                Neumorphic Button
                            </button>
                            <button 
                                className="text-white font-bold rounded-xl px-6 py-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:opacity-90"
                                style={{ background: theme.gradient, boxShadow: `5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF` }}
                            >
                                Primary Button
                            </button>
                            <button 
                                className="bg-neu-bg text-text-muted rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer"
                                style={{ boxShadow: '4px 4px 8px #D1D9E6, -4px -4px 8px #FFFFFF' }}
                                onMouseEnter={(e) => e.target.style.color = theme.primary}
                                onMouseLeave={(e) => e.target.style.color = ''}
                            >
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                            <button 
                                className="bg-neu-bg text-text-muted rounded-xl w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer"
                                style={{ boxShadow: '4px 4px 8px #D1D9E6, -4px -4px 8px #FFFFFF' }}
                                onMouseEnter={(e) => e.target.style.color = theme.primary}
                                onMouseLeave={(e) => e.target.style.color = ''}
                            >
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Section: Cards */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>dashboard</span>
                        Cards & Containers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Flat Card */}
                        <div className="neu-flat p-6">
                            <h3 className="font-bold text-text-primary mb-2">Flat Card (.neu-flat)</h3>
                            <p className="text-sm text-text-muted">
                                Elevated kaart met soft shadows. Hover voor effect.
                            </p>
                        </div>
                        
                        {/* Pressed Container */}
                        <div className="neu-pressed p-6">
                            <h3 className="font-bold text-text-primary mb-2">Pressed (.neu-pressed)</h3>
                            <p className="text-sm text-text-muted">
                                Inset container, ideaal voor inputs en slots.
                            </p>
                        </div>

                        {/* Large Card */}
                        <div className="neu-card-lg">
                            <h3 className="font-bold text-text-primary mb-2">Large Card (.neu-card-lg)</h3>
                            <p className="text-sm text-text-muted">
                                Grotere padding en meer afgeronde hoeken.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section: Stats Cards */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>monitoring</span>
                        Stat Cards (Dashboard Style)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="neu-stat-card">
                            <span 
                                className="material-symbols-outlined mb-2 p-2 rounded-full"
                                style={{ color: theme.primary, backgroundColor: `${theme.primary}15` }}
                            >folder_open</span>
                            <p className="text-3xl font-extrabold text-text-primary">3</p>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Actieve Projecten</p>
                        </div>
                        <div className="neu-stat-card">
                            <span className="material-symbols-outlined text-yellow-500 mb-2 bg-yellow-100 p-2 rounded-full">pending_actions</span>
                            <p className="text-3xl font-extrabold text-text-primary">5</p>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Wachtend</p>
                        </div>
                        <div className="neu-stat-card">
                            <span className="material-symbols-outlined text-green-500 mb-2 bg-green-100 p-2 rounded-full">trending_up</span>
                            <p className="text-3xl font-extrabold text-text-primary">85%</p>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Profiel Score</p>
                        </div>
                        <div className="neu-stat-card relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-400"></div>
                            <span className="material-symbols-outlined text-red-400 mb-2 bg-red-100 p-2 rounded-full">timer</span>
                            <p className="text-xl font-extrabold text-text-primary">15 Dec</p>
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">Deadline</p>
                        </div>
                    </div>
                </section>

                {/* Section: Form Elements */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>edit_note</span>
                        Form Elements
                    </h2>
                    <div className="neu-card-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2">Zoekveld</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Zoek projecten, skills..." 
                                        className="neu-input w-full pl-12"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-2">Text Input</label>
                                <input 
                                    type="text" 
                                    placeholder="Voer tekst in..." 
                                    className="neu-input w-full"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Badges & Pills */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>label</span>
                        Badges & Skills
                    </h2>
                    <div className="neu-card-lg">
                        <div className="space-y-6">
                            {/* Skill Pills */}
                            <div>
                                <p className="text-sm font-bold text-text-secondary mb-3">Skill Pills (Primary):</p>
                                <div className="flex flex-wrap gap-3">
                                    {['React', 'TypeScript', 'UX Design', 'Python'].map((skill) => (
                                        <span 
                                            key={skill}
                                            className="px-4 py-2 text-xs font-bold rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                                            style={{ 
                                                background: theme.gradient,
                                                boxShadow: `3px 3px 8px ${theme.shadow}, -2px -2px 6px rgba(255, 255, 255, 0.8)`
                                            }}
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200/50">
                                <p className="text-sm font-bold text-text-secondary mb-3">Skill Pills Varianten:</p>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <span 
                                        className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200"
                                        style={{ color: theme.primary, backgroundColor: `${theme.primary}15`, border: `1px solid ${theme.primary}30` }}
                                    >
                                        Subtle
                                    </span>
                                    <span 
                                        className="px-4 py-2 text-xs font-bold rounded-xl bg-transparent transition-all duration-200"
                                        style={{ color: theme.primary, border: `2px solid ${theme.primary}60` }}
                                    >
                                        Outline
                                    </span>
                                    <button 
                                        className="px-4 py-2 text-xs font-bold border-2 border-dashed rounded-xl transition-colors"
                                        style={{ color: theme.primary, borderColor: `${theme.primary}40` }}
                                    >
                                        + Toevoegen
                                    </button>
                                </div>
                            </div>

                            {/* Status Badges - Glass */}
                            <div className="pt-4 border-t border-gray-200/50">
                                <p className="text-sm font-bold text-text-secondary mb-3">Status Badges (Glass effect):</p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="neu-badge-success">Geaccepteerd</span>
                                    <span className="neu-badge-warning">In Afwachting</span>
                                    <span className="neu-badge-error">Afgewezen</span>
                                    <span className="neu-badge-info">Nieuw</span>
                                </div>
                            </div>

                            {/* Status Badges - Solid */}
                            <div className="pt-4 border-t border-gray-200/50">
                                <p className="text-sm font-bold text-text-secondary mb-3">Status Badges (Solid - meer nadruk):</p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="neu-badge-success-solid">Geaccepteerd</span>
                                    <span className="neu-badge-warning-solid">In Afwachting</span>
                                    <span className="neu-badge-error-solid">Afgewezen</span>
                                    <span 
                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white"
                                        style={{ background: theme.gradient, boxShadow: `0 2px 8px ${theme.shadow}` }}
                                    >
                                        Actief
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Progress */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>timeline</span>
                        Progress Indicators
                    </h2>
                    <div className="neu-card-lg space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-text-muted">Project Voortgang</span>
                                <span style={{ color: theme.primary }}>75%</span>
                            </div>
                            <div className="neu-progress">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: '75%', background: theme.gradient }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-text-muted">Profiel Compleet</span>
                                <span style={{ color: theme.primary }}>45%</span>
                            </div>
                            <div className="neu-progress">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: '45%', background: theme.gradient }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Example Project Card */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>work</span>
                        Project Card Preview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <article className="neu-pressed p-0 overflow-hidden rounded-2xl bg-neu-bg">
                            <div 
                                className="h-44 w-full relative overflow-hidden flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${theme.primary}20 0%, ${theme.primary}05 100%)` }}
                            >
                                <span className="material-symbols-outlined text-6xl" style={{ color: `${theme.primary}30` }}>rocket_launch</span>
                                <div className="absolute bottom-4 left-4 right-4 text-text-primary">
                                    <h4 className="font-bold text-lg leading-tight">AI Customer Support Bot</h4>
                                    <p className="text-xs font-semibold text-text-muted">Frontend Developer</p>
                                </div>
                                <div className="absolute top-3 right-3">
                                    <span className="neu-badge-success-solid">In Progress</span>
                                </div>
                            </div>
                            
                            <div className="p-5">
                                <div className="mb-5">
                                    <div className="flex justify-between text-xs font-bold text-text-muted mb-2">
                                        <span>Progress</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="neu-progress">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ width: '75%', background: theme.gradient }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-6 text-xs font-bold text-text-muted bg-white/40 p-3 rounded-xl border border-white/50 shadow-sm">
                                    <span className="material-symbols-outlined text-sm" style={{ color: theme.primary }}>assignment</span>
                                    <span className="truncate">Next: Integrate Chat API</span>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        className="flex-1 neu-flat py-2.5 text-xs transition-colors rounded-xl font-bold uppercase tracking-wide"
                                        onMouseEnter={(e) => e.target.style.color = theme.primary}
                                        onMouseLeave={(e) => e.target.style.color = ''}
                                    >
                                        Tasks
                                    </button>
                                    <button 
                                        className="neu-flat w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                        onMouseEnter={(e) => e.target.style.color = theme.primary}
                                        onMouseLeave={(e) => e.target.style.color = ''}
                                    >
                                        <span className="material-symbols-outlined text-lg">chat</span>
                                    </button>
                                </div>
                            </div>
                        </article>

                        {/* Profile Widget Preview */}
                        <div className="neu-card-lg flex flex-col items-center text-center">
                            <div className="mb-6">
                                <div 
                                    className="w-28 h-28 rounded-full neu-flat p-2 flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}05 100%)` }}
                                >
                                    <span className="material-symbols-outlined text-5xl" style={{ color: `${theme.primary}60` }}>person</span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-extrabold text-text-primary">Student Naam</h3>
                            <p className="text-sm font-bold text-text-muted mb-6 bg-gray-200/50 px-3 py-1 rounded-full mt-2">
                                Hogeschool van Arnhem en Nijmegen
                            </p>
                            
                            {/* Skill Pills */}
                            <div className="flex flex-wrap gap-3 justify-center mb-6">
                                <span 
                                    className="px-4 py-2 text-xs font-bold rounded-xl text-white"
                                    style={{ background: theme.gradient, boxShadow: `3px 3px 8px ${theme.shadow}` }}
                                >UX Research</span>
                                <span 
                                    className="px-4 py-2 text-xs font-bold rounded-xl text-white"
                                    style={{ background: theme.gradient, boxShadow: `3px 3px 8px ${theme.shadow}` }}
                                >Figma</span>
                                <span 
                                    className="px-4 py-2 text-xs font-bold rounded-xl"
                                    style={{ color: theme.primary, backgroundColor: `${theme.primary}15` }}
                                >React</span>
                                <button 
                                    className="px-4 py-2 text-xs font-bold rounded-xl border-2 border-dashed transition-colors cursor-pointer"
                                    style={{ color: theme.primary, borderColor: `${theme.primary}40` }}
                                >+ Add</button>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-text-muted">Profiel Compleet</span>
                                    <span style={{ color: theme.primary }}>75%</span>
                                </div>
                                <div className="w-full h-4 neu-pressed rounded-full overflow-hidden p-[2px]">
                                    <div 
                                        className="h-full rounded-full shadow-sm relative overflow-hidden" 
                                        style={{ width: '75%', background: theme.gradient }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center py-8 border-t border-gray-200/50">
                    <p className="text-sm text-text-muted font-semibold">
                        Kies een kleur hierboven om te zien hoe het design eruitziet.
                    </p>
                    <p className="text-xs text-text-muted mt-2">
                        Huidige selectie: <code className="px-2 py-1 rounded" style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>{theme.name} ({theme.primary})</code>
                    </p>
                </footer>
            </div>
        </div>
    );
}

