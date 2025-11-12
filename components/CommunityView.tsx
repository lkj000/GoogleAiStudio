import React, { useState, useEffect, useMemo } from 'react';
import { PluginTemplate, TemplateCategory } from '../types';
import { SearchIcon, UserIcon, HeartIcon, DownloadStatIcon, SpeakerActiveIcon } from './icons';
import { fetchCommunityPlugins, CommunityPlugin } from '../services/apiService';
import Loader from './Loader';
import * as audioEngine from '../services/audioEngine';

const FilterButton: React.FC<{ label: string; active: boolean; onClick: () => void; }> = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${active ? 'bg-accent text-white' : 'bg-surface text-secondary hover:bg-background'}`}>
        {label}
    </button>
);

const CommunityPluginCard: React.FC<{ plugin: CommunityPlugin; onLoad: (plugin: PluginTemplate) => void; }> = ({ plugin, onLoad }) => (
    <div 
        className="bg-surface/80 backdrop-blur-sm rounded-lg p-5 flex flex-col border border-background hover:border-accent/50 transition-all group hover:scale-105 hover:shadow-lg hover:shadow-accent-glow/20 relative"
        onMouseEnter={() => audioEngine.previewPlugin(plugin)}
        onMouseLeave={() => audioEngine.stopPreview()}
    >
        {plugin.framework === 'Web Audio' && (
            <div className="absolute top-3 right-3 text-secondary group-hover:text-accent transition-colors">
                <SpeakerActiveIcon />
            </div>
        )}
        <div className="flex-grow">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-primary">{plugin.name}</h3>
                <div className="flex items-center space-x-1 text-xs text-secondary">
                    <UserIcon />
                    <span>{plugin.author}</span>
                </div>
            </div>
             <div className="flex items-center space-x-2 text-xs mb-3">
                <span className="bg-background text-secondary px-2 py-0.5 rounded">{plugin.type}</span>
                <span className="bg-background text-secondary px-2 py-0.5 rounded">{plugin.framework}</span>
            </div>
            <p className="text-secondary text-sm mb-4">{plugin.description}</p>
            <div className="flex flex-wrap gap-2">
                {plugin.tags.map(tag => <span className="bg-hot-pink/20 text-hot-pink text-xs font-medium px-2.5 py-1 rounded-full" key={tag}>{tag}</span>)}
            </div>
        </div>
        <div className="flex items-center justify-between mt-6">
             <div className="flex items-center space-x-4 text-secondary">
                <div className="flex items-center space-x-1">
                    <HeartIcon />
                    <span className="text-sm">{plugin.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <DownloadStatIcon />
                    <span className="text-sm">{plugin.downloads}</span>
                </div>
             </div>
             <button onClick={() => onLoad(plugin)} className="flex items-center justify-center bg-accent text-primary font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition-colors">
                Load Plugin
            </button>
        </div>
    </div>
);

const CommunityView: React.FC<{ onLoadPlugin: (plugin: PluginTemplate) => void; }> = ({ onLoadPlugin }) => {
    const [plugins, setPlugins] = useState<CommunityPlugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | TemplateCategory>('All');

    useEffect(() => {
        const loadPlugins = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchCommunityPlugins();
                setPlugins(data);
            } catch (e: any) {
                setError("Could not load community plugins. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        loadPlugins();
    }, []);

    const filteredPlugins = useMemo(() => {
        return plugins
            .filter(plugin => activeFilter === 'All' || plugin.type === activeFilter)
            .filter(plugin =>
                plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plugin.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
    }, [plugins, searchQuery, activeFilter]);

    if (isLoading) {
        return <Loader message="Connecting to Community Hub..." />;
    }

    if (error) {
         return (
            <div className="p-8 text-center text-hot-pink h-full flex flex-col justify-center items-center">
                <h3 className="text-xl font-semibold">An Error Occurred</h3>
                <p className="mt-2">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="p-6">
            <div className="bg-surface/50 border border-background rounded-lg p-5 mb-6">
                <h2 className="text-xl font-bold text-primary">Community Showcase</h2>
                <p className="text-secondary mt-1">
                    Explore and load plugins created by the Amapiano AI community.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search plugins, authors, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface/50 border border-background rounded-full py-2 pl-10 pr-4 text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <FilterButton label="All" active={activeFilter === 'All'} onClick={() => setActiveFilter('All')} />
                    <FilterButton label="Instrument" active={activeFilter === 'instrument'} onClick={() => setActiveFilter('instrument')} />
                    <FilterButton label="Effect" active={activeFilter === 'effect'} onClick={() => setActiveFilter('effect')} />
                    <FilterButton label="Utility" active={activeFilter === 'utility'} onClick={() => setActiveFilter('utility')} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlugins.map(plugin => (
                    <CommunityPluginCard key={plugin.id} plugin={plugin} onLoad={onLoadPlugin} />
                ))}
            </div>
             {filteredPlugins.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <h3 className="text-lg font-semibold text-primary">No Plugins Found</h3>
                    <p className="text-secondary mt-1">Try adjusting your search or filter criteria.</p>
                </div>
            )}
        </div>
    );
};

export default CommunityView;