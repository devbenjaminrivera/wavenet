'use client';

import React from 'react';
import {
  RouterEmisor, SimConfig,
  VELOCIDAD_LUZ, FRECUENCIAS,
  ROUTER_SLOTS, MAX_ROUTERS,
} from '../types/simulator';

interface Props {
  routers:    RouterEmisor[];
  setRouters: React.Dispatch<React.SetStateAction<RouterEmisor[]>>;
  config:     SimConfig;
  setConfig:  React.Dispatch<React.SetStateAction<SimConfig>>;
  deltaR:     number | null;
  tipoInter:  string | null;
}

// Toggle reutilizable
const Toggle = ({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between cursor-pointer select-none group">
    <span className="text-[13px] text-[var(--text-soft)] group-hover:text-[var(--text)] transition-colors">{label}</span>
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 focus:outline-none ${
        checked
  ? 'bg-[var(--primary)]'
  : 'bg-[var(--surface-alt)]'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-[14px]' : 'translate-x-0'
      }`} />
    </button>
  </label>
);

// Slider con label + valor
const Param = ({
  label, value, min, max, step, unit, accent, format, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; accent: string; format?: (v: number) => string;
  onChange: (v: number) => void;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : value.toFixed(2);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[var(--text-soft)]">{label}</span>
        <span className="text-sm font-medium text-[var(--text)]">{display} {unit}</span>
      </div>
      <div className="relative h-[3px] rounded-full bg-[var(--surface-alt)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: accent }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-[3px]"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[13px] h-[13px] rounded-full border-2 border-[#080C12] shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 6.5px)`, background: accent }}
        />
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<Props> = ({
  routers, setRouters, config, setConfig, deltaR, tipoInter,
}) => {
  const upd = (id: string, k: keyof RouterEmisor, v: number) =>
    setRouters(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r));

  const addRouter = () => {
    if (routers.length >= MAX_ROUTERS) return;
    const i    = routers.length;
    const slot = ROUTER_SLOTS[i];
    setRouters(prev => [...prev, {
      id: slot.label,
      x: 2 + Math.random() * 8,
      y: 2 + Math.random() * 5,
      frecuencia: FRECUENCIAS[config.frecuenciaGlobal],
      potencia: 1.5,
      fase: 0,
    }]);
  };

  const removeRouter = (id: string) => {
    if (routers.length <= 1) return;
    setRouters(prev => prev.filter(r => r.id !== id));
  };

  const freq   = FRECUENCIAS[config.frecuenciaGlobal];
  const lambda = VELOCIDAD_LUZ / freq;
  const lambdaCm = (lambda * 100).toFixed(1);

  const interColor =
  tipoInter === 'constructiva'
    ? 'var(--success)'
    : tipoInter === 'destructiva'
      ? 'var(--danger)'
      : tipoInter === 'mixta'
        ? 'var(--warning)'
        : 'var(--text-soft)';

  return (
    <div className="flex flex-col gap-5 p-4">

      {/* ── Frecuencia ── */}
      <section>
        <p className="sec-label">Banda Wi-Fi</p>
        <div className="flex rounded-md overflow-hidden border border-[var(--border)]">
          {(['2.4', '5.0'] as const).map(f => (
            <button
              key={f}
              onClick={() => setConfig(prev => ({ ...prev, frecuenciaGlobal: f }))}
              className={`flex-1 py-2 text-sm font-medium transition-all ${
                config.frecuenciaGlobal === f
                  ? 'bg-[var(--surface-alt)] text-[var(--primary)] shadow-[inset_0_-2px_0_var(--primary)]'
: 'text-[var(--text-soft)] hover:text-[var(--text)]'
              }`}
            >
              {f} GHz
            </button>
          ))}
        </div>
      </section>

      {/* ── Parámetros físicos ── */}
      <section>
        <p className="sec-label">Parámetros Físicos</p>
        <div className="phys-box">
          <div className="phys-row">
            <span className="phys-k">f</span>
            <span className="phys-v">{config.frecuenciaGlobal} GHz</span>
          </div>
          <div className="phys-row">
            <span className="phys-k">λ = c / f</span>
            <span className="phys-v">{lambdaCm} cm</span>
          </div>
          <div className="phys-row">
            <span className="phys-k">c</span>
            <span className="phys-v">3×10⁸ m/s</span>
          </div>
          <div className="phys-row">
            <span className="phys-k">k = 2π/λ</span>
            <span className="phys-v">uniforms GPU</span>
          </div>
          <div className="phys-row" style={{ borderBottom: 'none' }}>
            <span className="phys-k">Motor</span>
            <span className="phys-v">WebGL · GLSL</span>
          </div>
        </div>
      </section>

      {/* ── Análisis cursor ── */}
      <section>
        <p className="sec-label">Análisis en Cursor</p>
        <div className="phys-box">
          <div className="phys-row">
            <span className="phys-k">Δr = |d₁−d₂|</span>
            <span className="phys-v">{deltaR !== null ? `${deltaR} cm` : '—'}</span>
          </div>
          <div className="phys-row" style={{ borderBottom: 'none' }}>
            <span className="phys-k">Tipo</span>
            <span className="font-mono text-[11px] font-bold" style={{ color: interColor }}>
              {tipoInter
                ? tipoInter.charAt(0).toUpperCase() + tipoInter.slice(1)
                : 'Mueve el cursor'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Entorno global ── */}
      <section>
        <p className="sec-label">Entorno Global</p>
        <div className="phys-box flex flex-col gap-3 !p-4">
          <Toggle
            label="Marcar zonas muertas"
            checked={config.mostrarZonasMuertas}
            onChange={v => setConfig(p => ({ ...p, mostrarZonasMuertas: v }))}
          />
          <Toggle
            label="Propagación activa"
            checked={config.animarOndas}
            onChange={v => setConfig(p => ({ ...p, animarOndas: v }))}
          />
          <div className="pt-1">
            <Param
              label="Zoom (px/m)" value={config.escalaPixelsPorMetro}
              min={20} max={100} step={5} unit="px" accent="#6366F1"
              format={v => v.toFixed(0)}
              onChange={v => setConfig(p => ({ ...p, escalaPixelsPorMetro: v }))}
            />
          </div>
        </div>
      </section>

      {/* ── Nodos emisores ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="sec-label !mb-0">Nodos TX</p>
          <button
            onClick={addRouter}
            disabled={routers.length >= MAX_ROUTERS}
            className="text-xs font-medium text-[var(--primary)] border border-[var(--border)] rounded px-2 py-1
hover:border-[var(--primary)] hover:bg-[var(--surface-alt)] transition-all
disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Añadir
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {routers.map((r, i) => {
            const slot = ROUTER_SLOTS[i] ?? ROUTER_SLOTS[0];
            return (
              <div key={r.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: slot.color }} />
                    <span className="text-sm font-semibold text-[var(--text)]">{r.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-soft)]">
                      {r.x.toFixed(1)}m / {r.y.toFixed(1)}m
                    </span>
                    {routers.length > 1 && (
                      <button
                        onClick={() => removeRouter(r.id)}
                        className="text-[var(--text-soft)] hover:text-[var(--danger)] text-xs border border-[var(--border)] rounded px-1.5 py-0.5 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <Param
                  label="Potencia" value={r.potencia}
                  min={0.5} max={3.0} step={0.1} unit="W"
                  accent={slot.color}
                  onChange={v => upd(r.id, 'potencia', v)}
                />
                <Param
                  label="Fase φ" value={r.fase}
                  min={0} max={Math.PI * 2} step={0.01} unit="rad"
                  accent="#6366F1"
                  format={v => v.toFixed(2)}
                  onChange={v => upd(r.id, 'fase', v)}
                />
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
