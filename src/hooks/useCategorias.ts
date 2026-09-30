import { useEffect, useState } from 'react';
import { servicioProductos } from '@/services/servicioProductos';
import type { Categoria } from '@/types';

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    let cancelado = false;
    servicioProductos
      .obtenerCategorias()
      .then((categoriasCargadas) => {
        if (!cancelado) setCategorias(categoriasCargadas);
      })
      .catch((err) => {
        if (!cancelado) {
          console.error('useCategorias: no se pudieron cargar las categorías.', err);
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return categorias;
}
