'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Coordenadas relativas de los emisores (porcentajes de 0 a 100)
  const [router1, setRouter1] = useState({ x: 30, y: 50 });
  const [router2, setRouter2] = useState({ x: 70, y: 50 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.3; // Velocidad de propagación temporal
      
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // 1. Parámetros físicos (Escalados para visualización)
      const lambda = 12.5; // Longitud de onda (12.5 cm)
      const k = (2 * Math.PI) / lambda; // Número de onda

      // Convertir posiciones a píxeles absolutos
      const r1x = (router1.x / 100) * width;
      const r1y = (router1.y / 100) * height;
      const r2x = (router2.x / 100) * width;
      const r2y = (router2.y / 100) * height;

      let index = 0;

      // 2. Cálculo vectorial y Principio de Superposición para cada píxel
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          
          // Teorema de Pitágoras para d1 y d2
          const d1 = Math.sqrt((x - r1x) ** 2 + (y - r1y) ** 2);
          const d2 = Math.sqrt((x - r2x) ** 2 + (y - r2y) ** 2);

          // Función de onda senoidal: f(x,t) = A * sin(kx - wt)
          const wave1 = Math.sin(k * d1 - time);
          const wave2 = Math.sin(k * d2 - time);

          // Superposición: suma algebraica de las amplitudes
          const amplitude = wave1 + wave2; 
          
          // Intensidad (Amplitud al cuadrado) normalizada de 0 a 1
          const intensity = (amplitude ** 2) / 4; 

          // 3. Renderizado del Mapa de Calor
          // Zonas destructivas (0) -> Azules oscuros
          // Zonas constructivas (1) -> Cyan brillante
          data[index++] = Math.floor(intensity * 15);        // R
          data[index++] = Math.floor(intensity * 180 + 20);  // G
          data[index++] = Math.floor(intensity * 255 + 50);  // B
          data[index++] = 255;                               // Alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Dibujar marcadores de los routers
      ctx.fillStyle = '#3b82f6'; // Azul para el Router 1
      ctx.beginPath();
      ctx.arc(r1x, r1y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444'; // Rojo para el Router 2
      ctx.beginPath();
      ctx.arc(r2x, r2y, 3, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [router1, router2]);

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      
      {/* Panel Lateral */}
      <aside className="w-80 bg-slate-800 border-r border-slate-700 p-6 flex flex-col shadow-xl z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">WaveNet</h1>
          <p className="text-sm text-slate-400 mt-1">Simulador de Interferencia Wi-Fi</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              Emisor 1 (Azul)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Posición X ({router1.x}%)</label>
                <input 
                  type="range" min="0" max="100" value={router1.x} 
                  onChange={(e) => setRouter1({...router1, x: Number(e.target.value)})}
                  className="w-full accent-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Posición Y ({router1.y}%)</label>
                <input 
                  type="range" min="0" max="100" value={router1.y} 
                  onChange={(e) => setRouter1({...router1, y: Number(e.target.value)})}
                  className="w-full accent-blue-500" 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h2 className="text-lg font-semibold text-slate-200 mb-3 flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              Emisor 2 (Rojo)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Posición X ({router2.x}%)</label>
                <input 
                  type="range" min="0" max="100" value={router2.x} 
                  onChange={(e) => setRouter2({...router2, x: Number(e.target.value)})}
                  className="w-full accent-red-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Posición Y ({router2.y}%)</label>
                <input 
                  type="range" min="0" max="100" value={router2.y} 
                  onChange={(e) => setRouter2({...router2, y: Number(e.target.value)})}
                  className="w-full accent-red-500" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Parámetros Físicos</h3>
            <div className="flex items-center justify-between text-sm bg-slate-900 p-3 rounded border border-slate-700">
              <span className="text-slate-400">Frecuencia:</span>
              <span className="font-mono text-cyan-400">2.4 GHz</span>
            </div>
            <div className="flex items-center justify-between text-sm bg-slate-900 p-3 rounded border border-slate-700 mt-2">
              <span className="text-slate-400">Longitud (λ):</span>
              <span className="font-mono text-emerald-400">12.5 cm</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal de Simulación */}
      <main className="flex-1 relative bg-slate-950 flex items-center justify-center p-8">
        <div className="relative w-full max-w-4xl aspect-[4/3] bg-black rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden z-10 flex items-center justify-center">
          <canvas 
            ref={canvasRef}
            width={200} 
            height={150} 
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </main>

    </div>
  );
}