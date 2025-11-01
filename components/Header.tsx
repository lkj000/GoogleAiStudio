import React from 'react';
import { HomeIcon, GenerateIcon, SocialIcon, AnalyzeIcon, SamplesIcon, PatternsIcon, DawIcon, Aura808Icon, UserIcon, SettingsIcon } from './icons';

const NavLink: React.FC<{ icon: React.ReactNode; children: React.ReactNode; active?: boolean }> = ({ icon, children, active }) => (
    <a href="#" className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-surface text-primary' : 'text-secondary hover:bg-surface hover:text-primary'}`}>
        {icon}
        <span>{children}</span>
    </a>
);

const Header: React.FC = () => {
    return (
        <header className="bg-background/80 backdrop-blur-sm border-b border-surface text-white shadow-md sticky top-0 z-40">
            <div className="max-w-screen-2xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                             <div className="text-accent h-8 w-8 flex items-center justify-center">
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#logo-gradient)" />
                                    <path d="M2 17l10 5 10-5" stroke="url(#logo-gradient)" />
                                    <path d="M2 12l10 5 10-5" stroke="url(#logo-gradient)" />
                                    <defs>
                                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#F72585" />
                                            <stop offset="100%" stopColor="#8A42D6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <span className="font-bold text-xl">Amapiano AI</span>
                        </div>
                        <nav className="hidden md:flex items-center space-x-2">
                            <NavLink icon={<HomeIcon />} active>Home</NavLink>
                            <NavLink icon={<GenerateIcon />}>Generate</NavLink>
                            <NavLink icon={<SocialIcon />}>Social</NavLink>
                            <NavLink icon={<AnalyzeIcon />}>Analyze</NavLink>
                            <NavLink icon={<SamplesIcon />}>Samples</NavLink>
                            <NavLink icon={<PatternsIcon />}>Patterns</NavLink>
                            <NavLink icon={<DawIcon />}>DAW</NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <NavLink icon={<Aura808Icon />}>Aura 808</NavLink>
                        <button className="p-2 rounded-full text-secondary hover:bg-surface hover:text-primary"><UserIcon /></button>
                        <button className="p-2 rounded-full text-secondary hover:bg-surface hover:text-primary"><SettingsIcon /></button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;