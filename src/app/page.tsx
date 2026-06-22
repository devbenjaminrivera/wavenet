'use client';

import { useState } from 'react';
import { RouterEmisor, SimConfig, FRECUENCIA_WIFI_DEFAULT } from '../types/simulator';
import { WaveSimulator } from '../components/WaveSimulator';
import { ControlPanel } from '../components/ControlPanel';

export default function Home() {
  const [routers, setRouters] = useState<RouterEmisor[]>([
    { id: 'TX-01', x: 3.0, y: 4.5, frecuencia: FRECUENCIA_WIFI_DEFAULT, potencia: 1.5, fase: 0 },
    { id: 'TX-02', x: 11.0, y: 4.5, frecuencia: FRECUENCIA_WIFI_DEFAULT, potencia: 1.5, fase: 0 },
  ]);

  const [config, setConfig] = useState<SimConfig>({
    escalaPixelsPorMetro: 50,
    mostrarZonasMuertas: true,
    animarOndas: true,
  });

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Panel Lateral de Controles (Sidebar) */}
      <aside className="w-80 h-full flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse"></div>
              WaveNet <span className="text-slate-500 font-light text-sm mt-1">PRO</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-500/70 mt-1 font-mono">
              RF Attenuation Engine
            </p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ControlPanel routers={routers} setRouters={setRouters} config={config} setConfig={setConfig} />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-center">
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">UNIDAD 4 • CINEMÁTICA DE ONDAS</p>
        </div>
      </aside>

      {/* Área Principal de Trabajo (Workspace) */}
      <main className="flex-1 flex flex-col relative bg-grid-pattern">
        
        {/* Topbar de Información */}
        <header className="h-14 border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              WebGL Render: <span className="text-white">Active</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
              Freq base: <span className="text-white">2.4 GHz</span>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Arrastra los nodos TX en el plano para recalcular la interferencia Δr
          </div>
        </header>

        {/* Contenedor del Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Efecto de resplandor sutil de fondo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden bg-[#050505] ring-1 ring-white/5">
            <WaveSimulator routers={routers} setRouters={setRouters} config={config} />
            
            {/* Overlay de telemetría sobre el canvas */}
            <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 text-[10px] text-cyan-400 font-mono px-3 py-2 rounded shadow-lg pointer-events-none">
              VIEWPORT ESCALA: 1M = {config.escalaPixelsPorMetro}PX
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}