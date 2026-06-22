// ─── Entidades del dominio ────────────────────────────────────────────────────

export interface RouterEmisor {
  id: string;
  x: number;        // metros dentro del plano de simulación
  y: number;
  frecuencia: number; // Hz (2.4e9 | 5.0e9)
  potencia: number;   // amplitud relativa (0.5 – 3.0)
  fase: number;       // desfase inicial en radianes (0 – 2π)
}

export interface SimConfig {
  escalaPixelsPorMetro: number;  // px / m — define el zoom del plano
  mostrarZonasMuertas: boolean;  // overlay de zonas de interferencia destructiva
  animarOndas: boolean;          // activa/pausa el ticker temporal
  frecuenciaGlobal: '2.4' | '5.0'; // banda Wi-Fi seleccionada
}

// ─── Constantes físicas ───────────────────────────────────────────────────────
export const VELOCIDAD_LUZ = 3e8;                         // c ≈ 3×10⁸ m/s
export const FRECUENCIAS: Record<'2.4' | '5.0', number> = {
  '2.4': 2.4e9,   // 2.4 GHz — λ ≈ 12.5 cm
  '5.0': 5.0e9,   // 5.0 GHz — λ ≈  6.0 cm
};
export const FRECUENCIA_WIFI_DEFAULT = FRECUENCIAS['2.4'];
export const LONGITUD_ONDA_DEFAULT   = VELOCIDAD_LUZ / FRECUENCIA_WIFI_DEFAULT;

// Colores y etiquetas fijos por nodo (hasta 5 emisores)
export const ROUTER_SLOTS = [
  { color: '#00E5FF', hex: 0x00E5FF, label: 'TX-01' },
  { color: '#FF6B2B', hex: 0xFF6B2B, label: 'TX-02' },
  { color: '#A855F7', hex: 0xA855F7, label: 'TX-03' },
  { color: '#22C55E', hex: 0x22C55E, label: 'TX-04' },
  { color: '#F59E0B', hex: 0xF59E0B, label: 'TX-05' },
] as const;

export const MAX_ROUTERS = 5;
