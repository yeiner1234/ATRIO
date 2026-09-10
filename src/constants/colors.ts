export const COLORS = {
  papel: '#F7F5F2',
  tinta: '#12110F',
  arcilla: '#C4552F',
  lino: '#E8E5E0',
  blanco: '#FFFFFF',

  textoSecundario: 'rgba(18, 17, 15, 0.55)',
  borde: 'rgba(18, 17, 15, 0.12)',

  tinta60: 'rgba(18, 17, 15, 0.60)',
  tinta50: 'rgba(18, 17, 15, 0.50)',
  tinta45: 'rgba(18, 17, 15, 0.45)',
  tinta42: 'rgba(18, 17, 15, 0.42)',
  tinta40: 'rgba(18, 17, 15, 0.40)',
  tinta35: 'rgba(18, 17, 15, 0.35)',
  tinta20: 'rgba(18, 17, 15, 0.20)',
  tinta14: 'rgba(18, 17, 15, 0.14)',
  tinta08: 'rgba(18, 17, 15, 0.08)',
  tinta72: 'rgba(18, 17, 15, 0.72)',

  arcilla10: 'rgba(196, 85, 47, 0.10)',

  papel90: 'rgba(247, 245, 242, 0.90)',

  papel45: 'rgba(247, 245, 242, 0.45)',
  papel20: 'rgba(247, 245, 242, 0.20)',
  papel60: 'rgba(247, 245, 242, 0.60)',
} as const;

export type NombreColor = keyof typeof COLORS;
