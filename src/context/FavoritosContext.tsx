import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CLAVES_ALMACENAMIENTO, servicioAlmacenamiento } from '@/services/storageService';

interface ValorFavoritosContext {
  idsFavoritos: string[];
  cantidadFavoritos: number;
  esFavorito: (productoId: string) => boolean;
  alternarFavorito: (productoId: string) => void;
  quitarFavorito: (productoId: string) => void;
}

export const FavoritosContext = createContext<ValorFavoritosContext | null>(null);

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [idsFavoritos, setIdsFavoritos] = useState<string[]>([]);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    servicioAlmacenamiento
      .obtenerDato<string[]>(CLAVES_ALMACENAMIENTO.favoritos)
      .then((guardados) => {
        if (guardados) setIdsFavoritos(guardados);
      })
      .finally(() => setHidratado(true));
  }, []);

  useEffect(() => {
    if (hidratado) {
      void servicioAlmacenamiento.guardarDato(CLAVES_ALMACENAMIENTO.favoritos, idsFavoritos);
    }
  }, [idsFavoritos, hidratado]);

  const esFavorito = useCallback(
    (productoId: string) => idsFavoritos.includes(productoId),
    [idsFavoritos],
  );

  const alternarFavorito = useCallback((productoId: string) => {
    setIdsFavoritos((previos) =>
      previos.includes(productoId)
        ? previos.filter((id) => id !== productoId)
        : [productoId, ...previos],
    );
  }, []);

  const quitarFavorito = useCallback((productoId: string) => {
    setIdsFavoritos((previos) => previos.filter((id) => id !== productoId));
  }, []);

  const valor = useMemo<ValorFavoritosContext>(
    () => ({
      idsFavoritos,
      cantidadFavoritos: idsFavoritos.length,
      esFavorito,
      alternarFavorito,
      quitarFavorito,
    }),
    [idsFavoritos, esFavorito, alternarFavorito, quitarFavorito],
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}
