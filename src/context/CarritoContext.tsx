import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cupones } from '@/data/cupones';
import { CLAVES_ALMACENAMIENTO, servicioAlmacenamiento } from '@/services/storageService';
import type { ItemCarrito, Producto, ResumenCompra } from '@/types';
import { calcularResumenCompra } from '@/utils/precio';

export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 20;

interface EstadoCarritoPersistido {
  items: ItemCarrito[];
  codigoCupon: string | null;
}

interface ValorCarritoContext {
  items: ItemCarrito[];
  contador: number;
  codigoCupon: string | null;
  porcentajeDescuento: number;
  resumen: ResumenCompra;
  agregarItem: (producto: Producto, talla: string, cantidad?: number) => void;
  quitarItem: (productoId: string, talla: string) => void;
  cambiarCantidad: (productoId: string, talla: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  aplicarCupon: (codigo: string) => boolean;
  quitarCupon: () => void;
}

export const CarritoContext = createContext<ValorCarritoContext | null>(null);

function limitarCantidad(cantidad: number): number {
  return Math.max(CANTIDAD_MINIMA, Math.min(CANTIDAD_MAXIMA, cantidad));
}

function mismaLinea(item: ItemCarrito, productoId: string, talla: string): boolean {
  return item.producto.id === productoId && item.talla === talla;
}

function buscarPorcentajeCupon(codigo: string): number | null {
  const encontrado = cupones.find(
    (cupon) => cupon.codigo.toUpperCase() === codigo.trim().toUpperCase(),
  );
  return encontrado ? encontrado.porcentaje : null;
}

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [codigoCupon, setCodigoCupon] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    servicioAlmacenamiento
      .obtenerDato<EstadoCarritoPersistido>(CLAVES_ALMACENAMIENTO.carrito)
      .then((guardado) => {
        if (guardado) {
          setItems(guardado.items ?? []);
          setCodigoCupon(guardado.codigoCupon ?? null);
        }
      })
      .finally(() => setHidratado(true));
  }, []);

  useEffect(() => {
    if (hidratado) {
      const aPersistir: EstadoCarritoPersistido = { items, codigoCupon };
      void servicioAlmacenamiento.guardarDato(CLAVES_ALMACENAMIENTO.carrito, aPersistir);
    }
  }, [items, codigoCupon, hidratado]);

  const agregarItem = useCallback((producto: Producto, talla: string, cantidad = 1) => {
    setItems((previos) => {
      const existente = previos.find((item) => mismaLinea(item, producto.id, talla));
      if (existente) {
        return previos.map((item) =>
          mismaLinea(item, producto.id, talla)
            ? { ...item, cantidad: limitarCantidad(item.cantidad + cantidad) }
            : item,
        );
      }
      return [...previos, { producto, talla, cantidad: limitarCantidad(cantidad) }];
    });
  }, []);

  const quitarItem = useCallback((productoId: string, talla: string) => {
    setItems((previos) => previos.filter((item) => !mismaLinea(item, productoId, talla)));
  }, []);

  const cambiarCantidad = useCallback(
    (productoId: string, talla: string, cantidad: number) => {
      setItems((previos) => {
        if (cantidad < CANTIDAD_MINIMA) {
          return previos.filter((item) => !mismaLinea(item, productoId, talla));
        }
        return previos.map((item) =>
          mismaLinea(item, productoId, talla)
            ? { ...item, cantidad: limitarCantidad(cantidad) }
            : item,
        );
      });
    },
    [],
  );

  const vaciarCarrito = useCallback(() => {
    setItems([]);
    setCodigoCupon(null);
  }, []);

  const aplicarCupon = useCallback((codigo: string) => {
    const porcentaje = buscarPorcentajeCupon(codigo);
    if (porcentaje == null) return false;
    setCodigoCupon(codigo.trim().toUpperCase());
    return true;
  }, []);

  const quitarCupon = useCallback(() => setCodigoCupon(null), []);

  const porcentajeDescuento = codigoCupon ? buscarPorcentajeCupon(codigoCupon) ?? 0 : 0;
  const contador = items.reduce((acc, item) => acc + item.cantidad, 0);
  const resumen = useMemo(
    () => calcularResumenCompra(items, porcentajeDescuento),
    [items, porcentajeDescuento],
  );

  const valor = useMemo<ValorCarritoContext>(
    () => ({
      items,
      contador,
      codigoCupon,
      porcentajeDescuento,
      resumen,
      agregarItem,
      quitarItem,
      cambiarCantidad,
      vaciarCarrito,
      aplicarCupon,
      quitarCupon,
    }),
    [
      items,
      contador,
      codigoCupon,
      porcentajeDescuento,
      resumen,
      agregarItem,
      quitarItem,
      cambiarCantidad,
      vaciarCarrito,
      aplicarCupon,
      quitarCupon,
    ],
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}
