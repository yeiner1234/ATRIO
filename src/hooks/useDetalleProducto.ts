import { useCallback, useMemo, useState } from 'react';
import { servicioProductos } from '@/services/servicioProductos';
import { useCarrito } from './useCarrito';

export function useDetalleProducto(id: string) {
  const producto = useMemo(() => servicioProductos.obtenerProductoPorId(id), [id]);
  const { agregarItem, contador } = useCarrito();

  const [tallaSeleccionada, setTallaSeleccionada] = useState<string | null>(null);
  const [errorTalla, setErrorTalla] = useState(false);

  const seleccionarTalla = useCallback((talla: string) => {
    setTallaSeleccionada(talla);
    setErrorTalla(false);
  }, []);

  const agregarAlCarrito = useCallback((): boolean => {
    if (!producto) return false;
    if (!tallaSeleccionada) {
      setErrorTalla(true);
      return false;
    }
    if (producto.stock <= 0) return false;
    agregarItem(producto, tallaSeleccionada, 1);
    return true;
  }, [producto, tallaSeleccionada, agregarItem]);

  return {
    producto,
    tallaSeleccionada,
    seleccionarTalla,
    errorTalla,
    agregarAlCarrito,
    contadorCarrito: contador,
  };
}
