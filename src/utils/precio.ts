import type { ItemCarrito, ResumenCompra } from '@/types';

export const TASA_IGV = 0.18;

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularResumenCompra(
  items: ItemCarrito[],
  porcentajeDescuento = 0,
): ResumenCompra {
  const subtotal = redondear(
    items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0),
  );
  const descuento = redondear(subtotal * (porcentajeDescuento / 100));
  const total = redondear(subtotal - descuento);
  const igv = redondear(total * (TASA_IGV / (1 + TASA_IGV)));
  return { subtotal, descuento, igv, total };
}
