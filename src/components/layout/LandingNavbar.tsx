import { Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingNavbar() {
    return (
        <nav className="sticky top-0 z-50 w-full flex min-h-[64px] px-6 py-[13px] items-center justify-center bg-[#08090A]/80 backdrop-blur-sm self-stretch border-b border-[#BBBFC4]/20">
            <div className="w-full max-w-7xl flex items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-[#29217E] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                        <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display font-bold text-xl text-white tracking-tight">
                        ToolHub
                    </span>
                </Link>
            </div>
        </nav>
    );
}
