export type MarcaTarjeta = 'Visa' | 'Mastercard' | 'Amex' | 'Tarjeta';

// Nunca se guarda el número completo ni el CVV.
export interface Tarjeta {
  id: string;
  titular: string;
  marca: MarcaTarjeta;
  ultimos4: string;
  vencimiento: string; // MM/AA
  predeterminada: boolean;
}

export type DatosTarjeta = Omit<Tarjeta, 'id'>;
