import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
    return (
        <section className="relative w-full overflow-hidden bg-[#08090A] flex flex-col items-center self-stretch pt-[111px] pb-[112px]">
            {/* Backlight Effect */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-60"
                style={{
                    backgroundImage: 'url(/assets/backlight.png)',
                    backgroundSize: '100% 98.936%',
                    backgroundPosition: '0px 0px',
                    backgroundRepeat: 'no-repeat',
                }}
            />

            <div className="relative z-10 w-full max-w-[1280px] px-6 flex flex-col items-center">
                {/* Hero Text */}
                <div className="text-center space-y-6 max-w-4xl animate-fade-in-up">
                    <h1
                        className="font-bold text-balance"
                        style={{
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontSize: '64px',
                            lineHeight: '83.2px',
                            letterSpacing: '-1.28px',
                            background: 'linear-gradient(180deg, #FFF 30%, rgba(255, 255, 255, 0.78) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        The Notification System your product deserves
                    </h1>
                    <p className="text-lg md:text-xl text-[#BBBFC4] max-w-2xl mx-auto leading-relaxed text-balance">
                        Developer & Product teams use ToolHub's centralized platform, APIs, and components to quickly build & easily manage multi-channel notifications – all while ensuring exceptional notification experience.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <Link to="/login">
                        <Button
                            size="lg"
                            className="px-8 py-6 rounded-lg bg-[#FFF] text-[#29217E] hover:bg-[#EFF7FF] font-bold text-lg shadow-xl shadow-white/5 transition-all transform hover:scale-105 active:scale-95"
                        >
                            Start Product
                        </Button>
                    </Link>
                </div>

                {/* Diagram Illustration */}
                <div className="w-full pt-20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-[#29217E]/20 border border-white/5 bg-white/5 backdrop-blur-sm p-4 md:p-8">
                        <img
                            src="/assets/diagram.png"
                            alt="SuprSend Diagram"
                            className="w-full h-auto rounded-xl"
                        />
                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    </div>

                    <div className="flex justify-center mt-6 gap-20 text-[#BBBFC4] text-sm font-medium tracking-widest uppercase">
                        <span>Your Application</span>
                        <span>Channels</span>
                        <span>Providers</span>
                        <span>Final Message</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
