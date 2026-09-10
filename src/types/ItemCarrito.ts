import type { Producto } from './Producto';

export interface ItemCarrito {
  producto: Producto;
  talla: string;
  cantidad: number;
}

export interface ResumenCompra {
  subtotal: number;
  descuento: number;
  igv: number;
  total: number;
}
