import { useCallback, useContext, useEffect, useState } from 'react';
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
  const {
    idsFavoritos,
    cargando: cargandoIds,
    error: errorIds,
    recargar: recargarIds,
    ...restoContexto
  } = contexto;

  const [productosFavoritos, setProductosFavoritos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState<string | null>(null);
  const [intentoCarga, setIntentoCarga] = useState(0);
  // Lista de IDs cuyos productos ya se terminaron de leer. Si no coincide con
  // la actual, sigue cargando: evita un instante de "vacío" justo cuando llegan
  // los IDs y el efecto de abajo todavía no arrancó.
  const [idsLeidos, setIdsLeidos] = useState<string[] | null>(null);

  // Reintenta las dos cargas: la lista de IDs y los productos.
  const recargar = useCallback(() => {
    recargarIds();
    setIntentoCarga((intento) => intento + 1);
  }, [recargarIds]);

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
        if (!cancelado) {
          setCargandoProductos(false);
          setIdsLeidos(idsFavoritos);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [idsFavoritos, intentoCarga]);

  return {
    ...restoContexto,
    idsFavoritos,
    productosFavoritos,
    cargandoFavoritos: cargandoIds || cargandoProductos || idsLeidos !== idsFavoritos,
    errorFavoritos: errorIds ?? errorProductos,
    recargar,
  };
}
