import React, { useState, useEffect } from 'react';
import {
  Brain,
  HardDrive,
  Cpu,
  Activity,
  Plus,
  Trash2,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  X,
  Radio,
} from 'lucide-react';
import { playConfirmChime, playJarvisBeep, speakPersona } from '../utils/audioSynthesizer';

interface SystemMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemMemoryModal: React.FC<SystemMemoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'MEMORY' | 'SYSTEM' | 'MONITORS' | 'UNDO'>('MEMORY');
  const [memory, setMemory] = useState<Record<string, Record<string, { value: string; updatedAt: string }>>>({});
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [monitors, setMonitors] = useState<string[]>([]);
  const [undoHistory, setUndoHistory] = useState<any[]>([]);

  // Add memory state
  const [newCat, setNewCat] = useState('preferences');
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  // Add monitor state
  const [newTopic, setNewTopic] = useState('');

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [memRes, sysRes, monRes, undoRes] = await Promise.all([
        fetch('/api/jarvis/memory').then((r) => r.json()),
        fetch('/api/jarvis/system-status').then((r) => r.json()),
        fetch('/api/jarvis/monitors').then((r) => r.json()),
        fetch('/api/jarvis/undo').then((r) => r.json()),
      ]);

      if (memRes.memory) setMemory(memRes.memory);
      if (sysRes) setSystemMetrics(sysRes);
      if (monRes.monitors) setMonitors(monRes.monitors);
      if (undoRes.history) setUndoHistory(undoRes.history);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  const handleSaveMemory = async () => {
    if (!newKey.trim() || !newVal.trim()) return;
    try {
      const res = await fetch('/api/jarvis/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCat, key: newKey, value: newVal }),
      });
      const data = await res.json();
      if (data.memory) setMemory(data.memory);
      playConfirmChime();
      speakPersona(`Remembered ${newKey} in ${newCat}.`, 'JARVIS');
      setNewKey('');
      setNewVal('');
    } catch (e) {}
  };

  const handleAddMonitor = async () => {
    if (!newTopic.trim()) return;
    try {
      const res = await fetch('/api/jarvis/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', topic: newTopic }),
      });
      const data = await res.json();
      if (data.monitors) setMonitors(data.monitors);
      playConfirmChime();
      speakPersona(`Now monitoring background developments for ${newTopic}.`, 'JARVIS');
      setNewTopic('');
    } catch (e) {}
  };

  const handleRemoveMonitor = async (topic: string) => {
    try {
      const res = await fetch('/api/jarvis/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', topic }),
      });
      const data = await res.json();
      if (data.monitors) setMonitors(data.monitors);
      playJarvisBeep();
    } catch (e) {}
  };

  const handleTriggerUndo = async () => {
    try {
      const res = await fetch('/api/jarvis/undo', { method: 'POST' });
      const data = await res.json();
      playConfirmChime();
      speakPersona(data.result, 'JARVIS');
      fetchData();
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-950 border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] flex flex-col max-h-[85vh] font-rajdhani">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm text-cyan-200 tracking-wider">
                STARK LONG-TERM MEMORY &amp; SYSTEM AUDITOR
              </h3>
              <p className="text-[11px] font-tech text-cyan-500/80">
                PERSISTENT KNOWLEDGE GRAPH, LIVE HARDWARE TELEMETRY &amp; UNDO STACK
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playJarvisBeep();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 my-3 border-b border-slate-800 pb-2">
          {[
            { id: 'MEMORY', label: 'LONG-TERM MEMORY', icon: Brain },
            { id: 'SYSTEM', label: 'HARDWARE METRICS', icon: Cpu },
            { id: 'MONITORS', label: `MONITORS (${monitors.length})`, icon: Radio },
            { id: 'UNDO', label: 'ACTION STACK', icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playJarvisBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'MEMORY' && (
            <div className="space-y-4">
              {/* Add New Memory Form */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="p-2 rounded bg-black border border-cyan-500/40 text-cyan-200 text-xs font-tech focus:outline-none"
                >
                  <option value="identity">Identity</option>
                  <option value="preferences">Preferences</option>
                  <option value="projects">Projects</option>
                  <option value="relationships">Relationships</option>
                  <option value="wishes">Wishes</option>
                  <option value="notes">Notes</option>
                </select>

                <input
                  type="text"
                  placeholder="Key (e.g. coffee_pref)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="p-2 rounded bg-black border border-cyan-500/40 text-cyan-200 text-xs font-tech focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Value (e.g. Black Espresso)"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  className="p-2 rounded bg-black border border-cyan-500/40 text-cyan-200 text-xs font-tech focus:outline-none"
                />

                <button
                  onClick={handleSaveMemory}
                  className="py-2 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-orbitron font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  SAVE FACT
                </button>
              </div>

              {/* Memory List Categorized */}
              <div className="space-y-3">
                {Object.entries(memory).map(([category, items]) => (
                  <div key={category} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-wider block mb-2">
                      [{category}]
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(items).map(([k, item]) => (
                        <div
                          key={k}
                          className="p-2 rounded-lg bg-black/70 border border-slate-800/80 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-tech text-xs text-slate-300 font-bold">{k}:</span>{' '}
                            <span className="text-xs text-cyan-200 font-sans">{item.value}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-tech">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {Object.keys(items).length === 0 && (
                        <div className="text-xs text-slate-500 font-tech">No records in this category.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SYSTEM' && systemMetrics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                  <div className="text-slate-400 text-[11px] font-tech">CPU LOAD</div>
                  <div className="text-lg font-orbitron font-bold text-cyan-300 mt-1">
                    {systemMetrics.cpuUsagePercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-tech truncate">{systemMetrics.cpuModel}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                  <div className="text-slate-400 text-[11px] font-tech">CPU TEMPERATURE</div>
                  <div className="text-lg font-orbitron font-bold text-amber-300 mt-1">
                    {systemMetrics.cpuTemperatureC} °C
                  </div>
                  <div className="text-[10px] text-emerald-400 font-tech">THERMAL STABLE</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                  <div className="text-slate-400 text-[11px] font-tech">MEMORY (RAM)</div>
                  <div className="text-lg font-orbitron font-bold text-cyan-300 mt-1">
                    {systemMetrics.ramPercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-tech">
                    {systemMetrics.usedRamGB} / {systemMetrics.totalRamGB} GB
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
                  <div className="text-slate-400 text-[11px] font-tech">UPTIME</div>
                  <div className="text-lg font-orbitron font-bold text-purple-300 mt-1">
                    {systemMetrics.uptimeHours} HRS
                  </div>
                  <div className="text-[10px] text-slate-500 font-tech">{systemMetrics.platform}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-orbitron font-bold text-xs text-slate-300 tracking-wider">
                  SYSTEM MONITOR DAEMON (MATCHING system_status.py)
                </span>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Real-time continuous background monitoring checks thermal dissipation, CPU load spikes, and memory saturation every 10 seconds, voicing automated proactive alerts when metrics exceed safety thresholds.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'MONITORS' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Topic to track (e.g. James Webb Telescope)"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="flex-1 p-2.5 rounded-lg bg-black border border-cyan-500/40 text-cyan-200 text-xs font-tech focus:outline-none"
                />
                <button
                  onClick={handleAddMonitor}
                  className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-orbitron font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ADD TOPIC
                </button>
              </div>

              <div className="space-y-2">
                {monitors.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="font-orbitron font-semibold text-xs text-cyan-200">{topic}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMonitor(topic)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      title="Stop Monitoring"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'UNDO' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-orbitron font-bold text-xs text-slate-300">
                  ACTION HISTORY &amp; REVERSAL
                </span>
                <button
                  onClick={handleTriggerUndo}
                  disabled={undoHistory.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  UNDO LAST ACTION
                </button>
              </div>

              <div className="space-y-2">
                {undoHistory.slice().reverse().map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-purple-400 font-bold font-tech">{act.actionType}</span>
                      <div className="text-slate-300 font-sans mt-0.5">{act.description}</div>
                    </div>
                    <span className="text-[10px] font-tech text-slate-500">{act.timestamp}</span>
                  </div>
                ))}
                {undoHistory.length === 0 && (
                  <div className="text-xs text-slate-500 font-tech p-4 text-center">
                    No actions logged yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
