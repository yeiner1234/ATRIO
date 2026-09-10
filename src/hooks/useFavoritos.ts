import { useContext, useMemo } from 'react';
import { FavoritosContext } from '@/context/FavoritosContext';
import { servicioProductos } from '@/services/servicioProductos';
import type { Producto } from '@/types';

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>');
  }

  const productosFavoritos = useMemo<Producto[]>(() => {
    return contexto.idsFavoritos
      .map((id) => servicioProductos.obtenerProductoPorId(id))
      .filter((producto): producto is Producto => producto !== undefined);
  }, [contexto.idsFavoritos]);

  return { ...contexto, productosFavoritos };
}
