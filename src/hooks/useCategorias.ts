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
        // Este hook devuelve Categoria[] directo (lo consumen 4 pantallas como
        // array plano); no se puede agregar un campo `error` sin tocarlas.
        // El error no se esconde: queda visible en consola y la lista queda
        // en `[]`, igual que un catálogo vacío (nunca se queda "cargando").
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
