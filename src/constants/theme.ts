export const ESPACIO = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  xxxl: 44,
  enorme: 56,
} as const;

export const RADIO = {
  imagen: 9,
  talla: 7,
  resumen: 10,
  chip: 20,
} as const;

export const MEDIDAS = {
  margenLateral: 20,
  gapTarjetas: 14,
  separacionSecciones: 26,
  areaTactilMinima: 44,
  alturaBarraPestanas: 74,
} as const;

export const RELACION_IMAGEN = {
  producto: 3 / 4,
  campana: 4 / 5,
} as const;

export const TIPOGRAFIA = {
  display: 'Archivo_900Black',
  titulo: 'Archivo_600SemiBold',
  etiqueta: 'Archivo_500Medium',
  cuerpo: 'Archivo_400Regular',
  mono: 'IBMPlexMono_500Medium',
  monoFuerte: 'IBMPlexMono_600SemiBold',
} as const;
