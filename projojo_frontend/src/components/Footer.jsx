export default function Footer() {
    return (
        <footer className="mt-16 py-8 bg-neu-bg border-t border-white/50">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <p className="text-sm text-text-muted font-semibold">
                    © {new Date().getFullYear()} Projojo
                </p>
            </div>
        </footer>
    )
}