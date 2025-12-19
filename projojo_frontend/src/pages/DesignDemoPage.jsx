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
        name: 'Coral (Huidige App)',
        emoji: '🍊',
        primary: '#FF7F50',
        primaryDark: '#FF6347',
        primaryLight: '#FFA07A',
        gradient: 'linear-gradient(135deg, #FF7F50 0%, #FFA07A 100%)',
        shadow: 'rgba(255, 127, 80, 0.3)',
    },
};

export default function DesignDemoPage() {
    const [activeTheme, setActiveTheme] = useState('coral');
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
                    <div className="neu-card-lg space-y-6">
                        {/* Primary Buttons */}
                        <div>
                            <p className="text-sm font-bold text-text-secondary mb-3">Primary & Neumorphic:</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                <button 
                                    className="bg-neu-bg font-bold rounded-xl px-5 py-2.5 transition-all duration-200 cursor-pointer inline-flex items-center justify-center hover:-translate-y-0.5"
                                    style={{ 
                                        boxShadow: '5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF',
                                        color: theme.primary 
                                    }}
                                >
                                    <span className="material-symbols-outlined text-lg mr-2">add</span>
                                    Neumorphic
                                </button>
                                <button 
                                    className="font-bold rounded-xl px-5 py-2.5 transition-all duration-200 cursor-pointer inline-flex items-center justify-center text-white hover:-translate-y-0.5"
                                    style={{ 
                                        background: theme.gradient,
                                        boxShadow: '5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF'
                                    }}
                                >
                                    <span className="material-symbols-outlined text-lg mr-2">check</span>
                                    Primary
                                </button>
                            </div>
                        </div>

                        {/* Landing Page Style - Glass & Bold */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Landing Page Style (Glass & Bold):</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                <button 
                                    className="group relative overflow-hidden rounded-2xl px-8 py-4 font-black text-white text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div 
                                        className="absolute inset-0 transition-opacity"
                                        style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                                    ></div>
                                    <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: `linear-gradient(to right, ${theme.primaryDark}, ${theme.primary})` }}
                                    ></div>
                                    <div className="relative flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                        <span>Start gratis</span>
                                    </div>
                                </button>
                                
                                {/* Glass variant */}
                                <button 
                                    className="group relative overflow-hidden rounded-2xl px-8 py-4 font-bold text-lg transition-all duration-300 hover:-translate-y-1"
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        backdropFilter: 'blur(12px)',
                                        border: `2px solid ${theme.primary}40`,
                                        color: theme.primary,
                                        boxShadow: `0 8px 32px ${theme.shadow}`
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <span>Glass Button</span>
                                    </div>
                                </button>

                                {/* Glow effect button */}
                                <button 
                                    className="relative rounded-2xl px-8 py-4 font-black text-white text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                                    style={{ 
                                        background: theme.gradient,
                                        boxShadow: `0 0 20px ${theme.shadow}, 0 0 40px ${theme.shadow}`
                                    }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">bolt</span>
                                        <span>Glow Effect</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Outline & Text Buttons */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Outline & Text:</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                <button 
                                    className="font-bold rounded-xl px-5 py-2.5 transition-all duration-200 cursor-pointer inline-flex items-center justify-center bg-neu-bg hover:-translate-y-0.5"
                                    style={{ 
                                        color: theme.primary,
                                        border: `2px solid ${theme.primary}`,
                                        boxShadow: '4px 4px 8px #D1D9E6, -4px -4px 8px #FFFFFF'
                                    }}
                                >
                                    <span className="material-symbols-outlined text-lg mr-2">edit</span>
                                    Outline
                                </button>
                                <button 
                                    className="font-semibold rounded-xl px-4 py-2 transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-1"
                                    style={{ color: theme.primary }}
                                >
                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                    Text Button
                                </button>
                            </div>
                        </div>

                        {/* Icon Buttons */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Icon Buttons:</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                {['settings', 'notifications', 'favorite', 'share', 'more_vert'].map((icon) => (
                                    <button 
                                        key={icon}
                                        className="bg-neu-bg w-11 h-11 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105"
                                        style={{ 
                                            boxShadow: '5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF',
                                            color: theme.primary 
                                        }}
                                    >
                                        <span className="material-symbols-outlined">{icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Disabled States */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Disabled States:</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                <button 
                                    className="bg-neu-bg font-bold rounded-xl px-5 py-2.5 opacity-50 cursor-not-allowed inline-flex items-center"
                                    style={{ boxShadow: '5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF' }}
                                    disabled
                                >
                                    Disabled
                                </button>
                                <button 
                                    className="font-bold rounded-xl px-5 py-2.5 opacity-50 cursor-not-allowed inline-flex items-center text-white"
                                    style={{ background: theme.gradient }}
                                    disabled
                                >
                                    Disabled Primary
                                </button>
                            </div>
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
                                Elevated kaart met soft shadows.
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

                        {/* Interactive Card */}
                        <div className="neu-flat-interactive p-6 cursor-pointer">
                            <h3 className="font-bold text-text-primary mb-2">Interactive (.neu-flat-interactive)</h3>
                            <p className="text-sm text-text-muted">
                                Hover voor lift effect met border highlight.
                            </p>
                        </div>

                        {/* Deep Pressed */}
                        <div className="neu-pressed-deep p-6">
                            <h3 className="font-bold text-text-primary mb-2">Deep Pressed (.neu-pressed-deep)</h3>
                            <p className="text-sm text-text-muted">
                                Extra diepe inset voor nadruk.
                            </p>
                        </div>

                        {/* XL Flat */}
                        <div className="neu-flat-xl p-6">
                            <h3 className="font-bold text-text-primary mb-2">XL Flat (.neu-flat-xl)</h3>
                            <p className="text-sm text-text-muted">
                                Grotere border-radius (2rem).
                            </p>
                        </div>
                    </div>

                    {/* Icon Containers */}
                    <div className="neu-card-lg">
                        <p className="text-sm font-bold text-text-secondary mb-4">Icon Containers:</p>
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="neu-icon-container">
                                    <span className="material-symbols-outlined text-2xl" style={{ color: theme.primary }}>folder</span>
                                </div>
                                <span className="text-xs text-text-muted">.neu-icon-container</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="neu-icon-container-sm">
                                    <span className="material-symbols-outlined text-lg" style={{ color: theme.primary }}>star</span>
                                </div>
                                <span className="text-xs text-text-muted">.neu-icon-container-sm</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="neu-icon-container">
                                    <span className="material-symbols-outlined text-2xl text-green-500">check_circle</span>
                                </div>
                                <span className="text-xs text-text-muted">Success</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="neu-icon-container">
                                    <span className="material-symbols-outlined text-2xl text-yellow-500">schedule</span>
                                </div>
                                <span className="text-xs text-text-muted">Pending</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="neu-icon-container">
                                    <span className="material-symbols-outlined text-2xl text-red-500">error</span>
                                </div>
                                <span className="text-xs text-text-muted">Error</span>
                            </div>
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
                    <div className="neu-card-lg space-y-6">
                        {/* Text Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1">Zoekveld <span style={{ color: theme.primary }}>*</span></label>
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
                                <label className="block text-sm font-bold text-text-primary mb-1">Text Input</label>
                                <input 
                                    type="text" 
                                    placeholder="Voer tekst in..." 
                                    className="neu-input w-full"
                                />
                            </div>
                        </div>

                        {/* Textarea */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <label className="block text-sm font-bold text-text-primary mb-1">Textarea</label>
                            <textarea 
                                placeholder="Beschrijf je project hier..."
                                rows={4}
                                className="neu-input w-full resize-none"
                            />
                        </div>

                        {/* Checkbox & Radio */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Checkbox & Radio:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: theme.primary }} defaultChecked />
                                        <span className="text-sm font-bold text-text-primary">Optie 1 (aangevinkt)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: theme.primary }} />
                                        <span className="text-sm font-bold text-text-primary">Optie 2</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer opacity-50">
                                        <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: theme.primary }} disabled />
                                        <span className="text-sm font-bold text-text-primary">Disabled optie</span>
                                    </label>
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="demo-radio" className="w-4 h-4" style={{ accentColor: theme.primary }} defaultChecked />
                                        <span className="text-sm font-bold text-text-primary">Radio optie A</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="demo-radio" className="w-4 h-4" style={{ accentColor: theme.primary }} />
                                        <span className="text-sm font-bold text-text-primary">Radio optie B</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="demo-radio" className="w-4 h-4" style={{ accentColor: theme.primary }} />
                                        <span className="text-sm font-bold text-text-primary">Radio optie C</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Validation States */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Validation States:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1">Error State</label>
                                    <input 
                                        type="text" 
                                        defaultValue="Ongeldige invoer"
                                        className="neu-input w-full !shadow-[inset_4px_4px_8px_#D1D9E6,inset_-4px_-4px_8px_#FFFFFF,0_0_0_2px_rgba(239,68,68,0.3)]"
                                    />
                                    <span className="block text-red-600 text-sm mt-1 font-medium">Dit veld is verplicht</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1">Disabled State</label>
                                    <input 
                                        type="text" 
                                        defaultValue="Niet bewerkbaar"
                                        disabled
                                        className="neu-input w-full opacity-70 cursor-not-allowed"
                                    />
                                </div>
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

                {/* Section: Alerts & Notifications */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>notifications_active</span>
                        Alerts & Feedback
                    </h2>
                    <div className="neu-card-lg space-y-6">
                        {/* Alert Component */}
                        <div>
                            <p className="text-sm font-bold text-text-secondary mb-3">Alert Component:</p>
                            <div className="neu-flat !rounded-2xl flex items-center gap-3 p-4 border-l-4" style={{ borderLeftColor: `${theme.primary}99` }}>
                                <div className="neu-pressed !rounded-full p-2">
                                    <span className="material-symbols-outlined text-lg" style={{ color: theme.primary }}>info</span>
                                </div>
                                <div className="text-sm font-medium text-text-secondary flex-1">
                                    Dit is een informatieve alert met een belangrijke melding voor de gebruiker.
                                </div>
                                <button className="neu-btn !p-2 !rounded-full">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Toast Notifications */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Toast Notifications:</p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center p-4 text-white bg-[#22bb33] rounded-lg shadow">
                                    <span className="material-symbols-outlined mr-2">check_circle</span>
                                    <p className="text-sm font-normal">Succesvol opgeslagen!</p>
                                </div>
                                <div className="flex items-center p-4 text-white bg-[#bb2124] rounded-lg shadow">
                                    <span className="material-symbols-outlined mr-2">error</span>
                                    <p className="text-sm font-normal">Er ging iets mis</p>
                                </div>
                                <div className="flex items-center p-4 text-white bg-[#f0ad4e] rounded-lg shadow">
                                    <span className="material-symbols-outlined mr-2">warning</span>
                                    <p className="text-sm font-normal">Let op: controleer je invoer</p>
                                </div>
                            </div>
                        </div>

                        {/* Loading Spinner */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Loading Spinner:</p>
                            <div className="flex flex-wrap gap-8 items-center">
                                <div className="flex flex-col items-center gap-2">
                                    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="animate-spin" style={{ color: theme.primary }}>
                                        <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                                            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" opacity=".2" />
                                            <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
                                        </g>
                                    </svg>
                                    <span className="text-xs text-text-muted">Small</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <svg width="40" height="40" viewBox="0 0 16 16" fill="currentColor" className="animate-spin" style={{ color: theme.primary }}>
                                        <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                                            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" opacity=".2" />
                                            <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
                                        </g>
                                    </svg>
                                    <span className="text-xs text-text-muted">Medium</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor" className="animate-spin" style={{ color: theme.primary }}>
                                        <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                                            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" opacity=".2" />
                                            <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
                                        </g>
                                    </svg>
                                    <span className="text-xs text-text-muted">Large</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Modal Preview */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>open_in_new</span>
                        Modal Preview
                    </h2>
                    <div className="neu-card-lg">
                        <p className="text-sm font-bold text-text-secondary mb-4">Statische modal preview (styling voorbeeld):</p>
                        <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
                            <div className="neu-card-lg max-w-md w-full">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                    <h3 className="text-xl font-bold text-text-primary">
                                        Modal Titel
                                    </h3>
                                    <button 
                                        className="text-text-muted rounded-xl text-sm w-10 h-10 inline-flex justify-center items-center transition-colors"
                                        style={{ '--hover-color': theme.primary, '--hover-bg': `${theme.primary}15` }}
                                        onMouseEnter={(e) => { e.target.style.color = theme.primary; e.target.style.backgroundColor = `${theme.primary}15`; }}
                                        onMouseLeave={(e) => { e.target.style.color = ''; e.target.style.backgroundColor = ''; }}
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="pt-4 space-y-4">
                                    <p className="text-sm text-text-secondary">
                                        Dit is de inhoud van de modal. Hier kun je formulieren, tekst of andere content plaatsen.
                                    </p>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <button className="bg-neu-bg font-bold rounded-xl px-5 py-2.5 transition-all duration-200" style={{ boxShadow: '5px 5px 10px #D1D9E6, -5px -5px 10px #FFFFFF' }}>Annuleren</button>
                                        <button className="font-bold rounded-xl px-5 py-2.5 text-white transition-all duration-200" style={{ background: theme.gradient }}>Bevestigen</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Task Cards */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>assignment</span>
                        Task Cards
                    </h2>
                    <div className="neu-card-lg space-y-6">
                        {/* Compact Task Box */}
                        <div>
                            <p className="text-sm font-bold text-text-secondary mb-3">Compact (.neu-task-box):</p>
                            <div className="space-y-3">
                                <div className="neu-task-box cursor-pointer hover:bg-white/60 transition-all">
                                    <span className="material-symbols-outlined" style={{ color: theme.primary }}>assignment</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="block truncate font-bold text-gray-600">Frontend implementatie</span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">2 plekken beschikbaar</span>
                                    </div>
                                    <span className="neu-badge-info shrink-0">Bezig</span>
                                </div>
                                <div className="neu-task-box cursor-pointer hover:bg-white/60 transition-all">
                                    <span className="material-symbols-outlined" style={{ color: theme.primary }}>assignment</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="block truncate font-bold text-gray-600">Backend API development</span>
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">1 plek beschikbaar</span>
                                    </div>
                                    <span className="neu-badge-success shrink-0">Voltooid</span>
                                </div>
                                <div className="neu-task-box !bg-amber-50 !border-amber-200">
                                    <span className="material-symbols-outlined text-amber-600">schedule</span>
                                    <span className="text-amber-700 text-sm">
                                        <strong>3</strong> aanmeldingen in behandeling
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Full Task Card */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Full Task Card:</p>
                            <div className="neu-flat p-5">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="neu-icon-container-sm" style={{ color: theme.primary }}>
                                                <span className="material-symbols-outlined">assignment</span>
                                            </div>
                                            <div>
                                                <h5 className="text-lg font-extrabold tracking-tight text-gray-700">UX Research</h5>
                                                <span className="neu-label">Taak</span>
                                            </div>
                                        </div>
                                        <span className="neu-badge-info shrink-0">Bezig</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                            <span>Bezetting</span>
                                            <span style={{ color: theme.primary }}>2 van 3 plekken</span>
                                        </div>
                                        <div className="neu-progress">
                                            <div className="neu-progress-bar" style={{ width: '66%', background: theme.gradient }} />
                                        </div>
                                        <p className="text-[10px] text-green-600 font-semibold mt-1.5">1 plek beschikbaar</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-full text-white" style={{ background: theme.primary, boxShadow: `0 2px 4px ${theme.shadow}` }}>Figma</span>
                                        <span className="skill-badge">User Testing</span>
                                        <span className="skill-badge">Interviews</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Segment Control / Tabs */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>tab</span>
                        Segment Control / Tabs
                    </h2>
                    <div className="neu-card-lg space-y-6">
                        <div>
                            <p className="text-sm font-bold text-text-secondary mb-3">.neu-segment-container:</p>
                            <div className="neu-segment-container inline-flex">
                                <button className="neu-segment-btn active">Overzicht</button>
                                <button className="neu-segment-btn">Projecten</button>
                                <button className="neu-segment-btn">Taken</button>
                                <button className="neu-segment-btn">Instellingen</button>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Alternative with pills:</p>
                            <div className="flex flex-wrap gap-2">
                                <button className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: theme.gradient }}>Alle</button>
                                <button className="px-4 py-2 rounded-full text-sm font-bold text-text-secondary bg-white/50 hover:bg-white/80 transition-colors">Actief</button>
                                <button className="px-4 py-2 rounded-full text-sm font-bold text-text-secondary bg-white/50 hover:bg-white/80 transition-colors">Afgerond</button>
                                <button className="px-4 py-2 rounded-full text-sm font-bold text-text-secondary bg-white/50 hover:bg-white/80 transition-colors">Concept</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Avatar & Status */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>account_circle</span>
                        Avatar & Status
                    </h2>
                    <div className="neu-card-lg">
                        <div className="flex flex-wrap gap-8 items-end">
                            {/* Avatar with status */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full p-0.5" style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryLight})` }}>
                                        <div className="w-full h-full rounded-full neu-pressed p-1 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}05 100%)` }}>
                                            <span className="material-symbols-outlined text-3xl" style={{ color: `${theme.primary}60` }}>person</span>
                                        </div>
                                    </div>
                                    <div className="neu-status-online absolute bottom-0 right-0"></div>
                                </div>
                                <span className="text-xs text-text-muted">Online</span>
                            </div>

                            {/* Avatar sizes */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}05 100%)` }}>
                                    <span className="material-symbols-outlined text-xl" style={{ color: `${theme.primary}60` }}>person</span>
                                </div>
                                <span className="text-xs text-text-muted">Medium</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full neu-flat flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}05 100%)` }}>
                                    <span className="material-symbols-outlined text-lg" style={{ color: `${theme.primary}60` }}>person</span>
                                </div>
                                <span className="text-xs text-text-muted">Small</span>
                            </div>

                            {/* Avatar group */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex -space-x-3">
                                    {[1,2,3,4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-neu-bg flex items-center justify-center" style={{ background: theme.gradient }}>
                                            <span className="material-symbols-outlined text-white text-sm">person</span>
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-neu-bg bg-gray-200 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-600">+5</span>
                                    </div>
                                </div>
                                <span className="text-xs text-text-muted">Stacked</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Page Headers & Labels */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>title</span>
                        Headers, Labels & Info
                    </h2>
                    <div className="neu-card-lg space-y-6">
                        {/* Page Header */}
                        <div>
                            <p className="text-sm font-bold text-text-secondary mb-3">PageHeader Component:</p>
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold text-gray-700 tracking-tight flex items-center gap-3">
                                    <span className="material-symbols-outlined text-4xl" style={{ color: theme.primary }}>dashboard</span>
                                    <span>Dashboard</span>
                                </h1>
                                <p className="text-sm text-gray-500 font-semibold mt-2">Welkom terug! Hier is je overzicht.</p>
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Label Styling:</p>
                            <div className="flex flex-wrap gap-6 items-center">
                                <div className="flex flex-col gap-1">
                                    <span className="neu-label">NEU-LABEL</span>
                                    <span className="text-xs text-text-muted">.neu-label</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="neu-label-sm">NEU-LABEL-SM</span>
                                    <span className="text-xs text-text-muted">.neu-label-sm</span>
                                </div>
                            </div>
                        </div>

                        {/* InfoBox */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">InfoBox Component:</p>
                            <div className="px-4 py-3 w-full neu-pressed rounded-xl text-sm font-medium text-text-secondary">
                                Dit is een InfoBox - ideaal voor het tonen van contextinformatie of tips aan gebruikers.
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-sm font-bold text-text-secondary mb-3">Empty State Pattern:</p>
                            <div className="neu-pressed p-8 text-center">
                                <div className="neu-icon-container mx-auto mb-4">
                                    <span className="material-symbols-outlined text-2xl text-text-muted">inbox</span>
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Geen projecten gevonden</h3>
                                <p className="text-sm text-text-muted mb-4">Je hebt nog geen actieve projecten. Begin met zoeken of maak een nieuw project aan.</p>
                                <button className="font-bold rounded-xl px-5 py-2.5 text-white inline-flex items-center" style={{ background: theme.gradient }}>
                                    <span className="material-symbols-outlined text-lg mr-2">add</span>
                                    Nieuw project
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Skill Badge Variants */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined" style={{ color: theme.primary }}>verified</span>
                        Skill Badge Variants
                    </h2>
                    <div className="neu-card-lg">
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-text-secondary">Skill badge varianten (dynamisch):</p>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="skill-badge">Requested</span>
                                    <span className="text-[10px] text-text-muted">Default</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-full text-white" style={{ background: theme.primary, boxShadow: `0 2px 4px ${theme.shadow}` }}>Matching</span>
                                    <span className="text-[10px] text-text-muted">Own/Match</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-full border-2 border-dashed" style={{ color: theme.primary, borderColor: `${theme.primary}80`, backgroundColor: `${theme.primary}08` }}>Pending</span>
                                    <span className="text-[10px] text-text-muted">Pending</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-full" style={{ color: theme.primary, backgroundColor: `${theme.primary}15`, border: `1px solid ${theme.primary}` }}>Subtle</span>
                                    <span className="text-[10px] text-text-muted">Subtle</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-full bg-transparent" style={{ color: theme.primary, border: `2px solid ${theme.primary}` }}>Outline</span>
                                    <span className="text-[10px] text-text-muted">Outline</span>
                                </div>
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

