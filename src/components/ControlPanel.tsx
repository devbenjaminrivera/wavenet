import React from 'react';
import { RouterEmisor, SimConfig } from '../types/simulator';

interface ControlPanelProps {
  routers: RouterEmisor[];
  setRouters: React.Dispatch<React.SetStateAction<RouterEmisor[]>>;
  config: SimConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimConfig>>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ routers, setRouters, config, setConfig }) => {
  const actualizarRouter = (id: string, campo: keyof RouterEmisor, valor: number) => {
    setRouters(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
  };

  return (
    <div className="flex flex-col p-4 gap-6">
      
      {/* Sección de Entorno Global */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1 h-3 bg-cyan-500 rounded-full"></span>
          Entorno Global
        </h2>
        
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex flex-col gap-4 shadow-inner">
          
          {/* Switch Moderno 1 */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Filtro Zonas Muertas</span>
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.mostrarZonasMuertas ? 'bg-cyan-500' : 'bg-slate-600'}`}>
              <input type="checkbox" className="sr-only" checked={config.mostrarZonasMuertas} onChange={(e) => setConfig(prev => ({ ...prev, mostrarZonasMuertas: e.target.checked }))} />
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.mostrarZonasMuertas ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </label>

          {/* Switch Moderno 2 */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Motor de Propagación</span>
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.animarOndas ? 'bg-cyan-500' : 'bg-slate-600'}`}>
              <input type="checkbox" className="sr-only" checked={config.animarOndas} onChange={(e) => setConfig(prev => ({ ...prev, animarOndas: e.target.checked }))} />
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.animarOndas ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </label>

        </div>
      </section>

      {/* Sección de Nodos Emisores */}
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
          Nodos Transmisores (TX)
        </h2>
        
        <div className="flex flex-col gap-4">
          {routers.map((router) => (
            <div key={router.id} className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-colors shadow-sm">
              
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
                <span className="text-sm font-bold text-white tracking-wide bg-slate-700 px-2 py-0.5 rounded shadow-inner">
                  {router.id}
                </span>
                <div className="text-[10px] text-cyan-400 font-mono bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50">
                  X:{router.x.toFixed(1)}m Y:{router.y.toFixed(1)}m
                </div>
              </div>

              {/* Control Potencia */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Potencia (Amplitud)</span>
                  <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    {router.potencia.toFixed(2)} W
                  </span>
                </div>
                <input
                  type="range" min="0.5" max="3.0" step="0.1"
                  value={router.potencia}
                  onChange={(e) => actualizarRouter(router.id, 'potencia', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none outline-none overflow-hidden [&::-webkit-slider-runnable-track]:bg-slate-900"
                  style={{ background: `linear-gradient(to right, #06b6d4 ${((router.potencia - 0.5) / 2.5) * 100}%, #0f172a ${((router.potencia - 0.5) / 2.5) * 100}%)` }}
                />
              </div>

              {/* Control Desfase */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Fase Inicial (Rad)</span>
                  <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    {router.fase.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range" min="0" max={Math.PI * 2} step="0.01"
                  value={router.fase}
                  onChange={(e) => actualizarRouter(router.id, 'fase', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-full appearance-none outline-none overflow-hidden"
                  style={{ background: `linear-gradient(to right, #6366f1 ${(router.fase / (Math.PI * 2)) * 100}%, #0f172a ${(router.fase / (Math.PI * 2)) * 100}%)` }}
                />
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  );
};