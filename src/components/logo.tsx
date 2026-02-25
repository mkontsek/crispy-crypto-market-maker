import Image from 'next/image';

export function Logo({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className} text-lg`}>
            <Image
                src="/logo.png"
                alt="Crispy Logo"
                width={32}
                height={32}
                style={{ display: 'block' }}
            />
        </div>
    );
}
