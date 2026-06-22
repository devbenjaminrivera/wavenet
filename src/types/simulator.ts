export interface RouterEmisor {
  id: string;
  x: number; // Posición en metros dentro del plano
  y: number;
  frecuencia: number; // En Hz (ej. 2.4e9)
  potencia: number; // Amplitud relativa de la señal
  fase: number; // Desfase inicial en radianes
}

export interface SimConfig {
  escalaPixelsPorMetro: number; // Cuántos píxeles representan 1 metro
  mostrarZonasMuertas: boolean;
  animarOndas: boolean;
}

// Constantes físicas del proyecto
export const VELOCIDAD_LUZ = 3e8; // c ≈ 3x10^8 m/s
export const FRECUENCIA_WIFI_DEFAULT = 2.4e9; // 2.4 GHz
// λ = c / f => 0.125 metros (12.5 cm)
export const LONGITUD_ONDA_DEFAULT = VELOCIDAD_LUZ / FRECUENCIA_WIFI_DEFAULT;