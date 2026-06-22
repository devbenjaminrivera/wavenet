'use client';

import React, { useRef, useEffect, useState } from 'react';
import { RouterEmisor, SimConfig, LONGITUD_ONDA_DEFAULT } from '../types/simulator';

interface WaveSimulatorProps {
  routers: RouterEmisor[];
  setRouters: React.Dispatch<React.SetStateAction<RouterEmisor[]>>;
  config: SimConfig;
}

export const WaveSimulator: React.FC<WaveSimulatorProps> = ({ routers, setRouters, config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [routerSeleccionado, setRouterSeleccionado] = useState<string | null>(null);
  const tiempoRef = useRef<number>(0);

  // Ciclo de renderizado de alta velocidad (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Crear un buffer de píxeles para procesamiento rápido
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      const scale = config.escalaPixelsPorMetro;
      const t = tiempoRef.current;
      const lambda = LONGITUD_ONDA_DEFAULT;

      // Optimización: Cachear posiciones de los routers convertidas a píxeles
      const routersCache = routers.map(r => ({
        px: r.x * scale,
        py: r.y * scale,
        potencia: r.potencia,
        fase: r.fase
      }));

      // Bucle anidado para calcular la interferencia en cada coordenada espacial (x, y)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let amplitudTotal = 0;

          // Si hay routers, sumamos sus contribuciones según el Principio de Superposición
          if (routersCache.length > 0) {
            routersCache.forEach(router => {
              // Teorema de Pitágoras para hallar la distancia en píxeles y luego en metros
              const dx = x - router.px;
              const dy = y - router.py;
              const distanciaMetros = Math.sqrt(dx * dx + dy * dy) / scale;

              if (distanciaMetros > 0.05) {
                // Ecuación armónica de la onda viajera: A * cos(2π * (d/λ) - ωt + φ)
                // Para simplificar la visualización temporal, usamos el desfase de distancia
                const faseDistancia = (2 * Math.PI * distanciaMetros) / lambda;
                const atenuacion = 1 / (distanciaMetros + 0.5); // Simulación de pérdida en el espacio
                
                amplitudTotal += router.potencia * atenuacion * Math.cos(faseDistancia - t + router.fase);
              }
            });
          }

          // Índice del píxel en el array unidimensional RGBA
          const index = (y * width + x) * 4;

          // Mapeo de la amplitud resultante a colores (Paleta técnica optimizada para modo oscuro)
          if (routersCache.length >= 2) {
            // Cuando hay superposición, analizamos la intensidad neta
            // Interferencia Constructiva (Señal Óptima) -> Tonos Verdes/Cian
            // Interferencia Destructiva (Zona Muerta) -> Negro/Gris Técnico u Oposición de fase
            const intensidad = Math.abs(amplitudTotal);
            
            if (config.mostrarZonasMuertas && intensidad < 0.15) {
              // Resaltar zonas muertas en un tono rojo/fucsia sutil para diagnóstico técnico
              data[index] = 239;     // R
              data[index + 1] = 68;  // G
              data[index + 2] = 68;  // B
            } else {
              // Gradiente dinámico de intensidad de señal (Mapa de calor)
              data[index] = Math.min(255, intensidad * 30);       // R
              data[index + 1] = Math.min(255, intensidad * 120);  // G
              data[index + 2] = Math.min(255, intensidad * 180);  // B
            }
          } else {
            // Monitoreo de un único router emisor (frentes de onda circulares concéntricos)
            const val = Math.floor((amplitudTotal + 1) * 127.5);
            data[index] = Math.max(0, Math.min(255, val * 0.2)); 
            data[index + 1] = Math.max(0, Math.min(255, val * 0.6)); 
            data[index + 2] = Math.max(0, Math.min(255, val));
          }
          
          data[index + 3] = 255; // Alpha completo
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Dibujar físicamente los iconos de los routers en el lienzo
      routers.forEach(router => {
        const rx = router.x * scale;
        const ry = router.y * scale;

        ctx.beginPath();
        ctx.arc(rx, ry, 12, 0, 2 * Math.PI);
        ctx.fillStyle = routerSeleccionado === router.id ? '#3b82f6' : '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Identificador de texto
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(router.id.toUpperCase(), rx - 6, ry + 3);
      });

      if (config.animarOndas) {
        tiempoRef.current += 0.15; // Velocidad de propagación temporal
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [routers, config, routerSeleccionado]);

  // Captura de eventos del ratón para arrastrar y posicionar los routers en el mapa
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const scale = config.escalaPixelsPorMetro;

    // Buscar si el usuario hizo click sobre un router existente
    const objetivo = routers.find(r => {
      const rx = r.x * scale;
      const ry = r.y * scale;
      const dist = Math.sqrt((clickX - rx) ** 2 + (clickY - ry) ** 2);
      return dist <= 15; // Radio de tolerancia de click
    });

    if (objetivo) {
      setRouterSeleccionado(objetivo.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!routerSeleccionado || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scale = config.escalaPixelsPorMetro;

    // Actualizar coordenadas del router mapeadas a metros
    setRouters(prev =>
      prev.map(r =>
        r.id === routerSeleccionado
          ? { ...r, x: Math.max(0, mouseX / scale), y: Math.max(0, mouseY / scale) }
          : r
      )
    );
  };

  const handleMouseUp = () => {
    setRouterSeleccionado(null);
  };

  return (
    <div className="w-full h-full flex justify-center items-center bg-black">
      <canvas
        ref={canvasRef}
        width={700} // Puedes hacer esto dinámico después si quieres responsividad total
        height={450}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-crosshair border border-neutral-800 bg-[#020202] max-w-full h-auto"
      />
      <div className="absolute bottom-4 right-4 text-[10px] text-amber-500 font-mono bg-black/80 px-2 py-1 border border-neutral-800">
        ESC: 1M = {config.escalaPixelsPorMetro}PX
      </div>
    </div>
  );
};