import { useMemo } from 'react';
import { campanaInicio } from '@/data/campana';
import { servicioProductos } from '@/services/servicioProductos';

export function useInicio() {
  return useMemo(
    () => ({
      campana: campanaInicio,
      categorias: servicioProductos.obtenerCategorias(),
      novedades: servicioProductos.obtenerNovedades(4),
    }),
    [],
  );
}
