export function CrispyWordmark({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/logo.svg"
                alt="Crispy Logo"
                width={32}
                height={32}
                style={{ display: 'block' }}
            />
            <span
                className="text-2xl font-bold text-white"
                style={{
                    fontFamily: 'Geist, sans-serif',
                    letterSpacing: '-0.02em',
                }}
            >
                Crispy
            </span>
        </div>
    );
}
