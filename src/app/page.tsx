'use client';

import { useState, useCallback } from 'react';
import { RouterEmisor, SimConfig, FRECUENCIAS, FRECUENCIA_WIFI_DEFAULT, VELOCIDAD_LUZ, ROUTER_SLOTS } from '../types/simulator';
import { WaveSimulator } from '../components/WaveSimulator';
import { ControlPanel } from '../components/ControlPanel';

export default function Home() {
  const [routers, setRouters] = useState<RouterEmisor[]>([
    { id: 'TX-01', x: 4.0,  y: 4.5, frecuencia: FRECUENCIA_WIFI_DEFAULT, potencia: 1.5, fase: 0 },
    { id: 'TX-02', x: 10.0, y: 4.5, frecuencia: FRECUENCIA_WIFI_DEFAULT, potencia: 1.5, fase: 0 },
  ]);

  const [config, setConfig] = useState<SimConfig>({
    escalaPixelsPorMetro: 50,
    mostrarZonasMuertas: true,
    animarOndas: true,
    frecuenciaGlobal: '2.4',
  });

  const [deltaR,    setDeltaR]    = useState<number | null>(null);
  const [tipoInter, setTipoInter] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCursor = useCallback(
    (data: { deltaR: number | null; tipo: string | null }) => {
      setDeltaR(data.deltaR);
      setTipoInter(data.tipo);
    }, []
  );

  // ── Generar reporte ASCII ────────────────────────────────────────────────
  const buildReport = () => {
    const freq    = FRECUENCIAS[config.frecuenciaGlobal];
    const lambda  = VELOCIDAD_LUZ / freq;
    const lCm     = (lambda * 100).toFixed(2);
    const date    = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const simId   = Math.random().toString(36).slice(2, 6).toUpperCase();

    const lines = routers.map((r, i) => {
      const slot = ROUTER_SLOTS[i] ?? ROUTER_SLOTS[0];
      return `  ${slot.label}  X:${r.x.toFixed(2)} m  Y:${r.y.toFixed(2)} m  P:${r.potencia.toFixed(2)} W  φ:${r.fase.toFixed(2)} rad`;
    }).join('\n');

    return `
=================================================================
         WAVENET — REPORTE DE ANÁLISIS DE ESPECTRO RF
=================================================================
  ID Simulación  : #${simId}
  Autor          : Benjamín Rivera Araneda
  Fecha          : ${date}

  [PARÁMETROS FÍSICOS]
  Banda          : ${config.frecuenciaGlobal} GHz (IEEE 802.11)
  f              : ${freq.toExponential(2)} Hz
  λ = c / f      : ${lCm} cm
  c              : 3×10⁸ m/s
  Motor render   : WebGL 1.0 — GLSL ES 1.00 (GPU)
  Zoom           : 1 m = ${config.escalaPixelsPorMetro} px
  Nodos activos  : ${routers.length}

  [COORDENADAS DE EMISIÓN]
${lines}

  [ESTADO DE INTERFERENCIA EN CURSOR]
  Δr = |d₁ − d₂| : ${deltaR !== null ? `${deltaR} cm` : '(sin datos)'}
  Tipo            : ${tipoInter ?? '(posiciona el cursor en el mapa)'}
  Cond. constr.   : Δr = n · λ = n · ${lCm} cm
  Cond. destr.    : Δr = (n + ½) · λ = (n + ½) · ${lCm} cm

  [LEYENDA DE COLOR]
  Cyan eléctrico : Interferencia constructiva (señal óptima)
  Azul-negro     : Interferencia destructiva (zona muerta)
  Rojo apagado   : Marca diagnóstica de zona muerta (filtro activo)
=================================================================
`.trim();
  };

  const report = exportOpen ? buildReport() : '';

  const interColor =
    tipoInter === 'constructiva' ? '#00E5FF' :
    tipoInter === 'destructiva'  ? '#EF4444' :
    tipoInter === 'mixta'        ? '#FF6B2B' : '#4A6680';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #080C12; color: #C8D6E5; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; }

        /* ── Design tokens ─────────────────────────────────────────────── */
        :root {
          --bg:       #080C12;
          --surface:  #0D1520;
          --surface2: #111E2F;
          --border:   #1A2D44;
          --text:     #C8D6E5;
          --muted:    #4A6680;
          --sub:      #8BA3BD;
          --cyan:     #00E5FF;
          --amber:    #FF6B2B;
          --indigo:   #6366F1;
        }

        /* ── Scrollbar ────────────────────────────────────────────────── */
        .custom-scroll::-webkit-scrollbar { width: 3px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── Sidebar helpers ──────────────────────────────────────────── */
        .sec-label {
          font-family: 'Space Mono', monospace;
          font-size: 8.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 8px;
          display: block;
        }

        .phys-box {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 2px 12px;
          overflow: hidden;
        }

        .phys-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(26,45,68,0.6);
          font-size: 11px;
        }

        .phys-k { color: var(--muted); }
        .phys-v { font-family: 'Space Mono', monospace; color: var(--cyan); font-size: 11px; }

        /* ── Canvas grid background for main area ─────────────────────── */
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 24px 24px;
          background-color: #080C12;
        }
      `}</style>

      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <aside style={{
          width: 292, minWidth: 292,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 16, fontWeight: 700,
              letterSpacing: '0.22em', color: 'var(--cyan)',
            }}>
              WAVENET
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Simulador de Interferencia Wi-Fi
            </div>
          </div>

          {/* Controles */}
          <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <ControlPanel
              routers={routers} setRouters={setRouters}
              config={config}   setConfig={setConfig}
              deltaR={deltaR}   tipoInter={tipoInter}
            />
          </div>

          {/* Botón exportar */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button
              onClick={() => setExportOpen(true)}
              style={{
                width: '100%', padding: '9px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text)',
                fontFamily: "'Space Mono', monospace",
                fontSize: 10, cursor: 'pointer',
                letterSpacing: '0.07em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--amber)';
                (e.target as HTMLButtonElement).style.color = 'var(--amber)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.target as HTMLButtonElement).style.color = 'var(--text)';
              }}
            >
              EXPORTAR REPORTE ASCII
            </button>
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px', borderTop: '1px solid var(--border)',
            fontFamily: "'Space Mono', monospace",
            fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em',
            flexShrink: 0,
          }}>
            UNIDAD 4 · CINEMÁTICA DE ONDAS
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <main className="grid-bg" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Topbar */}
          <header style={{
            height: 48, flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'rgba(13,21,32,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: 10,
          }}>
            <div style={{ display:'flex', gap: 10, alignItems:'center' }}>
              {/* Badge WebGL */}
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10, color: 'var(--cyan)',
                background: 'rgba(0,229,255,0.07)',
                border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: 4, padding: '3px 9px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                WebGL · GPU activo
              </div>

              {/* Badge frecuencia */}
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10, color: 'var(--sub)',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '3px 9px',
              }}>
                {config.frecuenciaGlobal} GHz
                <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                  λ={config.frecuenciaGlobal === '2.4' ? '12.5' : '6.0'} cm
                </span>
              </div>
            </div>

            {/* Δr en topbar */}
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: 'var(--muted)' }}>Δr</span>
              <span style={{ color: 'var(--text)' }}>{deltaR !== null ? `${deltaR} cm` : '—'}</span>
              {tipoInter && (
                <span style={{
                  fontWeight: 700, color: interColor,
                  background: `${interColor}18`,
                  border: `1px solid ${interColor}44`,
                  borderRadius: 4, padding: '2px 7px', fontSize: 9,
                }}>
                  {tipoInter.toUpperCase()}
                </span>
              )}
              <span style={{ color: 'var(--muted)', fontSize: 9 }}>
                · mueve el cursor sobre el mapa
              </span>
            </div>
          </header>

          {/* Canvas area */}
          <div style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', padding: '16px 20px 8px', minHeight: 0 }}>
            <div style={{
              position: 'relative',
              width: '100%', maxWidth: 1040,
              aspectRatio: '4/3',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(0,229,255,0.04), 0 20px 60px rgba(0,0,0,0.7)',
            }}>
              <WaveSimulator
                routers={routers}
                setRouters={setRouters}
                config={config}
                onCursorAnalysis={handleCursor}
              />

              {/* Badge esquina */}
              <div style={{
                position: 'absolute', top: 10, right: 10,
                fontFamily: "'Space Mono', monospace",
                fontSize: 8, letterSpacing: '0.1em',
                color: 'var(--muted)',
                background: 'rgba(8,12,18,0.75)',
                border: '1px solid var(--border)',
                borderRadius: 4, padding: '3px 7px',
                pointerEvents: 'none',
              }}>
                ESCALA · 1 M = {config.escalaPixelsPorMetro} PX
              </div>
            </div>
          </div>

          {/* Leyenda espectro */}
          <div style={{ flexShrink: 0, padding: '0 20px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap: 4 }}>
            <div style={{
              width: '100%', maxWidth: 1040, height: 5, borderRadius: 3,
              background: 'linear-gradient(to right, #030508 0%, #001020 15%, #00203A 30%, #005060 50%, #009EC0 70%, #00C8E8 85%, #00E5FF 100%)',
              border: '1px solid var(--border)',
            }} />
            <div style={{
              width: '100%', maxWidth: 1040,
              display: 'flex', justifyContent: 'space-between',
              fontFamily: "'Space Mono', monospace",
              fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.07em',
            }}>
              <span>DESTRUCTIVA [zona muerta]</span>
              <span>TRANSICIÓN</span>
              <span>CONSTRUCTIVA [señal óptima]</span>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL EXPORTACIÓN ─────────────────────────────────────────── */}
      {exportOpen && (
        <div
          onClick={() => { setExportOpen(false); setCopied(false); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(8,12,18,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, backdropFilter: 'blur(6px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: 24,
              width: 600, maxHeight: '82vh',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.12em',
              }}>
                REPORTE DE ANÁLISIS DE ESPECTRO
              </span>
              <button
                onClick={() => { setExportOpen(false); setCopied(false); }}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 4, color: 'var(--muted)',
                  padding: '3px 8px', cursor: 'pointer',
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                }}
              >
                Cerrar
              </button>
            </div>

            <pre style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10.5, lineHeight: 1.7,
              color: 'var(--text)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 6, padding: 16,
              whiteSpace: 'pre', overflow: 'auto',
              flex: 1,
            }}>
              {report}
            </pre>

            <button
              onClick={() => {
                navigator.clipboard.writeText(report);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{
                padding: '10px',
                background: copied ? 'rgba(34,197,94,0.08)' : 'rgba(0,229,255,0.07)',
                border: `1px solid ${copied ? '#22C55E' : 'var(--cyan)'}`,
                borderRadius: 6,
                color: copied ? '#22C55E' : 'var(--cyan)',
                fontFamily: "'Space Mono', monospace",
                fontSize: 11, cursor: 'pointer',
                letterSpacing: '0.06em', transition: 'all 0.15s',
              }}
            >
              {copied ? '✓ COPIADO AL PORTAPAPELES' : 'COPIAR AL PORTAPAPELES'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
