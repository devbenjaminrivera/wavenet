'use client';

/**
 * WaveSimulator — Motor de renderizado WebGL
 *
 * Implementa la simulación de interferencia de ondas electromagnéticas mediante
 * un Fragment Shader GLSL ejecutado directamente en GPU.
 *
 * Fundamentos físicos aplicados:
 *   • Teorema de Pitágoras: d_i = √((x−x_i)² + (y−y_i)²)
 *   • Función de onda armónica: ψ_i = A_i · cos(k·d_i − ωt + φ_i)
 *   • Principio de Superposición: ψ_total = Σ ψ_i
 *   • Número de onda: k = 2π/λ = 2πf/c
 *   • Condición constructiva: Δr = nλ
 *   • Condición destructiva:  Δr = (n + ½)λ
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RouterEmisor, SimConfig, VELOCIDAD_LUZ, FRECUENCIAS, ROUTER_SLOTS } from '../types/simulator';

// ─── GLSL Vertex Shader ───────────────────────────────────────────────────────
// Quad NDC que cubre el viewport completo
const VERT_SRC = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// ─── GLSL Fragment Shader ─────────────────────────────────────────────────────
// Cada fragmento (píxel) calcula de forma independiente en GPU la superposición
const FRAG_SRC = `
precision highp float;

uniform float uTime;         // tiempo acumulado → propagación temporal
uniform float uK;            // número de onda k = 2π/λ  (en px⁻¹)
uniform int   uCount;        // número de routers activos
uniform vec2  uPosPx[5];     // posiciones en PÍXELES con Y desde abajo (sistema gl_FragCoord)
uniform float uAmp[5];       // amplitudes (de potencia)
uniform float uFase[5];      // desfase inicial φ_i en radianes
uniform bool  uDeadZones;    // mostrar zonas muertas en rojo

void main() {
  // gl_FragCoord.xy: X desde izquierda, Y desde abajo — mismo sistema que uPosPx
  vec2 fragPx = gl_FragCoord.xy;

  float total  = 0.0;
  float maxAmp = 0.0;

  for (int i = 0; i < 5; i++) {
    if (i >= uCount) break;

    // d_i = √(Δx² + Δy²) — Teorema de Pitágoras (en píxeles)
    vec2  delta = fragPx - uPosPx[i];
    float d     = length(delta);

    if (d < 1.0) continue;

    // Atenuación por distancia (modelo de espacio libre simplificado)
    float atten = 1.0 / (d * 0.008 + 0.4);

    // ψ_i = A · atten · cos(k·d − ωt + φ)
    total  += uAmp[i] * atten * cos(uK * d - uTime + uFase[i]);
    maxAmp += uAmp[i] * atten;
  }

  // Intensidad normalizada [0, 1]
  float v = (maxAmp > 0.0) ? clamp(total / maxAmp * 0.5 + 0.5, 0.0, 1.0) : 0.5;

  // ── Mapa de color ────────────────────────────────────────────────────────
  // Referente visual: espectros de analizador de RF en modo oscuro.
  // Destructiva (v≈0): azul-negro apagado.  Constructiva (v≈1): cyan eléctrico.
  vec3 col;
  float intensity = abs(total / (maxAmp + 0.001));

  // Detectar zona muerta: intensidad < 12% del máximo
  if (uDeadZones && uCount >= 2 && intensity < 0.12) {
    // Rojo apagado técnico — marca diagnóstica de zona de sombra RF
    col = vec3(0.55, 0.06, 0.06);
  } else {
    // Gradiente de 4 pasos: negro → azul medianoche → azul océano → cyan
    if (v < 0.25) {
      col = mix(vec3(0.010, 0.020, 0.040), vec3(0.0, 0.07, 0.17),  v / 0.25);
    } else if (v < 0.5) {
      col = mix(vec3(0.0, 0.07, 0.17),    vec3(0.0, 0.22, 0.38),  (v - 0.25) / 0.25);
    } else if (v < 0.75) {
      col = mix(vec3(0.0, 0.22, 0.38),    vec3(0.0, 0.58, 0.75),  (v - 0.5)  / 0.25);
    } else {
      col = mix(vec3(0.0, 0.58, 0.75),    vec3(0.04, 0.90, 1.0),  (v - 0.75) / 0.25);
    }
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Inicialización WebGL ─────────────────────────────────────────────────────
function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
  if (!gl) throw new Error('WebGL no disponible en este navegador');

  const mkShader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(`Shader error: ${gl.getShaderInfoLog(s)}`);
    return s;
  };

  const prog = gl.createProgram()!;
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   VERT_SRC));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(`Link error: ${gl.getProgramInfoLog(prog)}`);

  gl.useProgram(prog);

  // Quad NDC
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    time:      gl.getUniformLocation(prog, 'uTime')!,
    k:         gl.getUniformLocation(prog, 'uK')!,
    count:     gl.getUniformLocation(prog, 'uCount')!,
    posPx:     gl.getUniformLocation(prog, 'uPosPx')!,
    amp:       gl.getUniformLocation(prog, 'uAmp')!,
    fase:      gl.getUniformLocation(prog, 'uFase')!,
    deadZones: gl.getUniformLocation(prog, 'uDeadZones')!,
  };

  return { gl, prog, u };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  routers: RouterEmisor[];
  setRouters: React.Dispatch<React.SetStateAction<RouterEmisor[]>>;
  config: SimConfig;
  onCursorAnalysis?: (data: { deltaR: number | null; tipo: string | null }) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export const WaveSimulator: React.FC<Props> = ({ routers, config, setRouters, onCursorAnalysis }) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const glCtx        = useRef<ReturnType<typeof initGL> | null>(null);
  const rafRef       = useRef<number>(0);
  const timeRef      = useRef(0);
  const routersRef   = useRef(routers);
  const configRef    = useRef(config);
  const dragging     = useRef<string | null>(null);

  useEffect(() => { routersRef.current = routers;  }, [routers]);
  useEffect(() => { configRef.current  = config;   }, [config]);

  // ── WebGL init + resize ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!;
    const parent = canvas.parentElement!;

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width  = w;
      canvas.height = h;
      if (overlayRef.current) {
        overlayRef.current.width  = w;
        overlayRef.current.height = h;
      }
      if (glCtx.current) {
        glCtx.current.gl.viewport(0, 0, w, h);
      }
    };

    try {
      glCtx.current = initGL(canvas);
    } catch (e) {
      console.error(e);
      return;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const { gl, u } = glCtx.current;

    const loop = () => {
      const rs  = routersRef.current;
      const cfg = configRef.current;
      if (cfg.animarOndas) timeRef.current += 0.016;
      const t = timeRef.current;

      const H = canvas.height;
      const freq     = FRECUENCIAS[cfg.frecuenciaGlobal];
      const lambda   = VELOCIDAD_LUZ / freq;
      // λ en píxeles: λ_px = λ_m × escala_px/m
      const lambdaPx = lambda * cfg.escalaPixelsPorMetro;
      const k        = (2 * Math.PI) / lambdaPx;

      gl.uniform1f(u.time,  t);
      gl.uniform1f(u.k,     k);
      gl.uniform1i(u.count, rs.length);
      gl.uniform1i(u.deadZones, cfg.mostrarZonasMuertas ? 1 : 0);

      // Posiciones en píxeles con Y desde abajo (sistema gl_FragCoord)
      // rx_px = r.x * scale
      // ry_px = r.y * scale  (Y=0 en metros → Y=0 px desde abajo = suelo)
      const posPx = new Float32Array(10);
      const amp   = new Float32Array(5);
      const fase  = new Float32Array(5);

      rs.forEach((r, i) => {
        posPx[i*2]   = r.x * cfg.escalaPixelsPorMetro;
        posPx[i*2+1] = r.y * cfg.escalaPixelsPorMetro;  // gl_FragCoord.y = 0 en bottom
        amp[i]       = r.potencia;
        fase[i]      = r.fase;
      });

      gl.uniform2fv(u.posPx, posPx);
      gl.uniform1fv(u.amp,   amp);
      gl.uniform1fv(u.fase,  fase);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── Overlay Canvas 2D: marcadores ──────────────────────────────────
      // Canvas 2D tiene Y=0 arriba. Convertir desde sistema gl_FragCoord:
      // ry_screen = H - ry_glCoord = H - r.y * scale
      const ov = overlayRef.current;
      if (ov) {
        const ctx = ov.getContext('2d')!;
        ctx.clearRect(0, 0, ov.width, ov.height);

        rs.forEach((r, i) => {
          const slot = ROUTER_SLOTS[i] ?? ROUTER_SLOTS[0];
          const rx   = r.x * cfg.escalaPixelsPorMetro;
          const ry   = H - r.y * cfg.escalaPixelsPorMetro;  // flip Y para Canvas 2D

          const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 18);
          g.addColorStop(0, slot.color + '50');
          g.addColorStop(1, slot.color + '00');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(rx, ry, 18, 0, Math.PI*2); ctx.fill();

          ctx.beginPath(); ctx.arc(rx, ry, 8, 0, Math.PI*2);
          ctx.fillStyle = slot.color;
          ctx.fill();
          ctx.strokeStyle = '#080C12';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = 'bold 7px monospace';
          ctx.fillStyle = '#080C12';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i+1), rx, ry);
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  // Convierte coordenadas de mouse (screen: Y=0 arriba) a metros con Y=0 abajo
  // para que coincidan con el sistema del shader (gl_FragCoord: Y=0 abajo)
  const getMeters = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scale  = configRef.current.escalaPixelsPorMetro;
    const mx     = (e.clientX - rect.left) / scale;
    // Invertir Y: pantalla tiene Y=0 arriba, shader tiene Y=0 abajo
    const my     = (canvas.height - (e.clientY - rect.top)) / scale;
    return { mx, my };
  }, []);

  const handleDown = useCallback((e: React.MouseEvent) => {
    const { mx, my } = getMeters(e);
    const scale = configRef.current.escalaPixelsPorMetro;
    const RADIO = 20 / scale;
    const hit = routersRef.current.find(r =>
      Math.hypot(r.x - mx, r.y - my) < RADIO
    );
    if (hit) dragging.current = hit.id;
  }, [getMeters]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) {
      // Análisis Δr en cursor
      if (onCursorAnalysis && routersRef.current.length >= 2) {
        const { mx, my } = getMeters(e);
        const rs = routersRef.current;
        const d1 = Math.hypot(mx - rs[0].x, my - rs[0].y);
        const d2 = Math.hypot(mx - rs[1].x, my - rs[1].y);
        const dr = Math.abs(d1 - d2);
        const freq   = FRECUENCIAS[configRef.current.frecuenciaGlobal];
        const lambda = VELOCIDAD_LUZ / freq;
        const rem    = (dr % lambda) / lambda;
        const tipo   = rem < 0.15 || rem > 0.85 ? 'constructiva'
                     : rem > 0.35 && rem < 0.65 ? 'destructiva'
                     : 'mixta';
        onCursorAnalysis({ deltaR: parseFloat((dr * 100).toFixed(1)), tipo });
      }
      return;
    }
    const { mx, my } = getMeters(e);
    const canvas  = canvasRef.current!;
    const scale   = configRef.current.escalaPixelsPorMetro;
    const maxX    = canvas.width  / scale;
    const maxY    = canvas.height / scale;
    setRouters(prev => prev.map(r =>
      r.id === dragging.current
        ? { ...r, x: Math.max(0.3, Math.min(maxX - 0.3, mx)), y: Math.max(0.3, Math.min(maxY - 0.3, my)) }
        : r
    ));
  }, [getMeters, setRouters, onCursorAnalysis]);

  const handleUp = useCallback(() => { dragging.current = null; }, []);

  return (
    <div className="relative w-full h-full" style={{ background: '#080C12' }}>
      {/* Canvas WebGL — motor GPU */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />
      {/* Canvas 2D — overlay de marcadores */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ display: 'block' }}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
      />
    </div>
  );
};
