import React, { useState } from 'react';
import { PluginModule } from '../types';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Plus,
  Zap,
  Shield,
  Gamepad2,
  Cpu,
  Smartphone,
  Mic,
  Activity,
  Search,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { playConfirmChime, playJarvisBeep, speakPersona } from '../utils/audioSynthesizer';

export const PluginManager: React.FC<{
  plugins: PluginModule[];
  onTogglePlugin: (id: string) => void;
  onAddPlugin: (plugin: PluginModule) => void;
}> = ({ plugins, onTogglePlugin, onAddPlugin }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState<'DEV' | 'TACTICAL' | 'CORE' | 'QUANTUM'>('DEV');

  const filteredPlugins = plugins.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.codename.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreatePlugin = () => {
    if (!customName.trim()) return;
    const newPlugin: PluginModule = {
      id: `plugin-${Date.now()}`,
      name: customName,
      codename: `STARK-EXT-${Math.floor(Math.random() * 900 + 100)}`,
      category: customCategory,
      description: customDesc || 'Custom user synthesized Stark AI plugin module.',
      enabled: true,
      version: '1.0.0',
      loadPercentage: Math.floor(Math.random() * 15 + 5),
      iconName: 'Sparkles',
    };
    onAddPlugin(newPlugin);
    playConfirmChime();
    speakPersona(`Plugin ${customName} successfully registered and hot-loaded into neural core.`, 'JARVIS');
    setIsModalOpen(false);
    setCustomName('');
    setCustomDesc('');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'TACTICAL':
        return 'text-red-400 border-red-800 bg-red-950/60';
      case 'DEV':
        return 'text-blue-400 border-blue-800 bg-blue-950/60';
      case 'QUANTUM':
        return 'text-purple-400 border-purple-800 bg-purple-950/60';
      case 'PERIPHERAL':
        return 'text-amber-400 border-amber-800 bg-amber-950/60';
      default:
        return 'text-cyan-400 border-cyan-800 bg-cyan-950/60';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto font-rajdhani">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-cyan-500/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-lg text-cyan-200 tracking-wider">
              STARK NEURAL PLUGIN ECOSYSTEM
            </h2>
            <p className="text-xs font-tech text-cyan-400/80">
              MODULAR CAPABILITIES &amp; SUB-ROUTINE ORCHESTRATION
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playJarvisBeep();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-tech text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>SYNTHESIZE NEW PLUGIN</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-4 flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-cyan-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plugins, codenames, functions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/80 border border-slate-800 text-xs font-tech text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', 'CORE', 'TACTICAL', 'DEV', 'QUANTUM', 'PERIPHERAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                playJarvisBeep();
              }}
              className={`px-2.5 py-1 rounded text-xs font-tech transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <div
            key={plugin.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              plugin.enabled
                ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                : 'bg-slate-950/60 border-slate-800/80 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-tech px-2 py-0.5 rounded border uppercase ${getCategoryColor(plugin.category)}`}>
                    {plugin.category} // {plugin.codename}
                  </span>
                  <h3 className="font-orbitron font-bold text-sm text-cyan-200 mt-2">
                    {plugin.name}
                  </h3>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => {
                    playJarvisBeep();
                    onTogglePlugin(plugin.id);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    plugin.enabled
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-400'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                  title={plugin.enabled ? 'Disable Plugin' : 'Enable Plugin'}
                >
                  {plugin.enabled ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-300 font-rajdhani leading-relaxed">
                {plugin.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-tech text-slate-400">
              <span>MEMORY LOAD: {plugin.enabled ? `${plugin.loadPercentage}%` : '0% (IDLE)'}</span>
              <span className="text-cyan-400">V{plugin.version}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Synthesize Plugin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-cyan-200 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              HOT-LOAD CUSTOM STARK PLUGIN
            </h3>

            <div>
              <label className="text-xs font-tech text-slate-400">PLUGIN MODULE NAME</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Vibranium Molecular Simulator"
                className="w-full p-2.5 mt-1 rounded-lg bg-black border border-cyan-500/40 text-cyan-200 font-tech text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-tech text-slate-400">CATEGORY</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="w-full p-2.5 mt-1 rounded-lg bg-black border border-cyan-500/40 text-cyan-200 font-tech text-xs focus:outline-none"
              >
                <option value="DEV">DEV // Code & Engineering</option>
                <option value="TACTICAL">TACTICAL // E.D.I.T.H. Defense</option>
                <option value="QUANTUM">QUANTUM // Physics & Neural</option>
                <option value="CORE">CORE // Arc Reactor & System</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-tech text-slate-400">MODULE CAPABILITIES / DESCRIPTION</label>
              <textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                rows={3}
                placeholder="Specifies logic, neural weight allocation, and automated protocols..."
                className="w-full p-2.5 mt-1 rounded-lg bg-black border border-cyan-500/40 text-cyan-200 font-tech text-xs focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-tech text-xs"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreatePlugin}
                disabled={!customName.trim()}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-orbitron font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                HOT-LOAD PLUGIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
