import { useMemo } from 'react';
import { servicioProductos } from '@/services/servicioProductos';

export function useCategorias() {
  return useMemo(() => servicioProductos.obtenerCategorias(), []);
}
