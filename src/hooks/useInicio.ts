import { useEffect, useState } from 'react';
import { campanaInicio } from '@/data/campana';
import { servicioProductos } from '@/services/servicioProductos';
import type { Categoria, Producto } from '@/types';

export function useInicio() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novedades, setNovedades] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    Promise.all([servicioProductos.obtenerCategorias(), servicioProductos.obtenerNovedades(4)])
      .then(([categoriasCargadas, novedadesCargadas]) => {
        if (cancelado) return;
        setCategorias(categoriasCargadas);
        setNovedades(novedadesCargadas);
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el inicio.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return { campana: campanaInicio, categorias, novedades, cargando, error };
}
