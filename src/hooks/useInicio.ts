import { useEffect, useState } from 'react';
import { campanaInicio } from '@/data/campana';
import { servicioCampana } from '@/services/servicioCampana';
import { servicioProductos } from '@/services/servicioProductos';
import type { CampanaInicio, Categoria, Producto } from '@/types';

export function useInicio() {
  const [campanas, setCampanas] = useState<CampanaInicio[]>([campanaInicio]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novedades, setNovedades] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    Promise.all([
      servicioCampana.obtenerCampanasActivas(),
      servicioProductos.obtenerCategorias(),
      servicioProductos.obtenerNovedades(4),
    ])
      .then(([campanasCargadas, categoriasCargadas, novedadesCargadas]) => {
        if (cancelado) return;
        setCampanas(campanasCargadas);
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

  return { campanas, categorias, novedades, cargando, error };
}
