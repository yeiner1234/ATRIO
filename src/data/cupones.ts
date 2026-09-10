export interface Cupon {
  codigo: string;
  porcentaje: number;
}

export const cupones: Cupon[] = [
  { codigo: 'ATRIO10', porcentaje: 10 },
  { codigo: 'BIENVENIDA', porcentaje: 15 },
];
