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
    <div className="flex flex-col h-full text-xs">
      {/* Cabecera del panel */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-3">
        <h2 className="text-white font-bold tracking-widest uppercase">Parámetros Globales</h2>
      </div>

      {/* Controles de Vista */}
      <div className="p-4 flex flex-col gap-4 border-b border-neutral-800">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-4 h-4 border border-neutral-600 group-hover:border-amber-500 bg-black">
            <input
              type="checkbox"
              checked={config.mostrarZonasMuertas}
              onChange={(e) => setConfig(prev => ({ ...prev, mostrarZonasMuertas: e.target.checked }))}
              className="peer sr-only"
            />
            <div className="hidden peer-checked:block w-2 h-2 bg-amber-500"></div>
          </div>
          <span className="text-neutral-400 group-hover:text-white transition-colors uppercase">Filtro Zonas Muertas</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-4 h-4 border border-neutral-600 group-hover:border-amber-500 bg-black">
            <input
              type="checkbox"
              checked={config.animarOndas}
              onChange={(e) => setConfig(prev => ({ ...prev, animarOndas: e.target.checked }))}
              className="peer sr-only"
            />
            <div className="hidden peer-checked:block w-2 h-2 bg-amber-500"></div>
          </div>
          <span className="text-neutral-400 group-hover:text-white transition-colors uppercase">Motor de Propagación</span>
        </label>
      </div>

      {/* Nodos Transmisores */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-neutral-900 border-y border-neutral-800 p-3">
          <h2 className="text-white font-bold tracking-widest uppercase">Nodos TX</h2>
        </div>
        
        {routers.map((router, index) => (
          <div key={router.id} className="p-4 border-b border-neutral-800 flex flex-col gap-5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-white font-bold bg-neutral-800 px-2 py-1">ID: {router.id}</span>
              <span className="text-neutral-500">X: {router.x.toFixed(2)}m | Y: {router.y.toFixed(2)}m</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-neutral-500 uppercase">Potencia (W)</span>
                <span className="text-amber-500">{router.potencia.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={router.potencia}
                onChange={(e) => actualizarRouter(router.id, 'potencia', parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-neutral-300 hover:[&::-webkit-slider-thumb]:bg-amber-500 cursor-ew-resize"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-neutral-500 uppercase">Desfase (Rad)</span>
                <span className="text-amber-500">{router.fase.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step="0.01"
                value={router.fase}
                onChange={(e) => actualizarRouter(router.id, 'fase', parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-neutral-300 hover:[&::-webkit-slider-thumb]:bg-amber-500 cursor-ew-resize"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};