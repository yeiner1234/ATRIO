import { useContext, useEffect, useState } from 'react';
import { FavoritosContext } from '@/context/FavoritosContext';
import { servicioProductos } from '@/services/servicioProductos';
import type { Producto } from '@/types';

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>');
  }

  // El contexto ya expone `cargando`/`error` para la lista de IDs (Supabase o
  // el AsyncStorage de invitado); acá se combinan con la carga de los
  // `Producto` completos, para que la pantalla reciba un solo estado.
  const { idsFavoritos, cargando: cargandoIds, error: errorIds, ...restoContexto } = contexto;

  const [productosFavoritos, setProductosFavoritos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargandoProductos(true);
    setErrorProductos(null);
    Promise.all(idsFavoritos.map((id) => servicioProductos.obtenerProductoPorId(id)))
      .then((resultados) => {
        if (cancelado) return;
        setProductosFavoritos(
          resultados.filter((producto): producto is Producto => producto !== undefined),
        );
      })
      .catch((err) => {
        if (!cancelado) {
          setErrorProductos(err instanceof Error ? err.message : 'No se pudieron cargar los favoritos.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoProductos(false);
      });
    return () => {
      cancelado = true;
    };
  }, [idsFavoritos]);

  return {
    ...restoContexto,
    idsFavoritos,
    productosFavoritos,
    cargandoFavoritos: cargandoIds || cargandoProductos,
    errorFavoritos: errorIds ?? errorProductos,
  };
}
