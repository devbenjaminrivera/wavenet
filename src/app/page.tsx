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
    <main className="min-h-screen bg-black text-neutral-300 font-mono p-4 sm:p-8">
      {/* Barra de estado superior estilo terminal */}
      <header className="border-b border-neutral-800 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tighter uppercase">
            WaveNet <span className="text-amber-500">SYS.SIM</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">
            Simulador de Atenuación RF | Freq: 2.4GHz
          </p>
        </div>
        <div className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 border border-amber-500/20">
          STATUS: ONLINE // RENDER: WEBGL_GPU
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border border-neutral-800 bg-black">
        {/* Lienzo del Simulador */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-neutral-800 p-4 relative">
          <div className="absolute top-6 left-6 text-[10px] text-neutral-600 z-10 pointer-events-none">
            [VIEWPORT_01] VISTA DE PLANTA 2D
          </div>
          <WaveSimulator routers={routers} setRouters={setRouters} config={config} />
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-1 bg-[#050505]">
          <ControlPanel routers={routers} setRouters={setRouters} config={config} setConfig={setConfig} />
        </div>
      </div>

      <footer className="mt-4 text-[10px] text-neutral-600 flex justify-between border-t border-neutral-800 pt-2 uppercase">
        <span>Unidad 4: Cinemática de Ondas</span>
        <span>Interferencia D/C Calculada en Tiempo Real</span>
      </footer>
    </main>
  );
}