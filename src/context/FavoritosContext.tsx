import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { servicioFavoritos } from '@/services/servicioFavoritos';
import { CLAVES_ALMACENAMIENTO, servicioAlmacenamiento } from '@/services/storageService';

interface ValorFavoritosContext {
  idsFavoritos: string[];
  cantidadFavoritos: number;
  cargando: boolean;
  error: string | null;
  esFavorito: (productoId: string) => boolean;
  alternarFavorito: (productoId: string) => void;
  quitarFavorito: (productoId: string) => void;
}

export const FavoritosContext = createContext<ValorFavoritosContext | null>(null);

// Invitado (sin sesión): favoritos locales al dispositivo, en AsyncStorage.
// Autenticado: la tabla `favoritos` de Supabase es la ÚNICA fuente — nunca
// se mezcla con lo que había guardado localmente como invitado, para no
// filtrar datos de un usuario a otro en el mismo dispositivo.
export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { usuario, listo } = useAuth();
  const [idsFavoritos, setIdsFavoritos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial y cada vez que cambia la sesión (login/logout).
  useEffect(() => {
    if (!listo) return; // espera a que AuthContext resuelva si hay sesión, para no "parpadear" en modo invitado.
    let cancelado = false;
    setCargando(true);
    setError(null);

    async function cargar() {
      try {
        if (usuario) {
          const ids = await servicioFavoritos.obtenerIdsFavoritos(usuario.id);
          if (!cancelado) setIdsFavoritos(ids);
        } else {
          const guardados = await servicioAlmacenamiento.obtenerDato<string[]>(
            CLAVES_ALMACENAMIENTO.favoritos,
          );
          if (!cancelado) setIdsFavoritos(guardados ?? []);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los favoritos.');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [usuario, listo]);

  // Solo se persiste localmente en modo invitado. Con sesión, Supabase ya es
  // la fuente y escribir en AsyncStorage además sería mezclar dos fuentes.
  useEffect(() => {
    if (!listo || usuario || cargando) return;
    void servicioAlmacenamiento.guardarDato(CLAVES_ALMACENAMIENTO.favoritos, idsFavoritos);
  }, [idsFavoritos, usuario, listo, cargando]);

  const esFavorito = useCallback(
    (productoId: string) => idsFavoritos.includes(productoId),
    [idsFavoritos],
  );

  // Optimista: la UI cambia de inmediato; si Supabase rechaza el cambio, se revierte y se reporta el error.
  const alternarFavorito = useCallback(
    (productoId: string) => {
      const yaEraFavorito = idsFavoritos.includes(productoId);
      setIdsFavoritos((previo) =>
        yaEraFavorito ? previo.filter((id) => id !== productoId) : [productoId, ...previo],
      );
      setError(null);

      if (!usuario) return; // invitado: no hay nada más que sincronizar.

      const sincronizacion = yaEraFavorito
        ? servicioFavoritos.quitarFavorito(usuario.id, productoId)
        : servicioFavoritos.agregarFavorito(usuario.id, productoId);

      sincronizacion.catch((err) => {
        setIdsFavoritos((previo) =>
          yaEraFavorito ? [productoId, ...previo] : previo.filter((id) => id !== productoId),
        );
        setError(err instanceof Error ? err.message : 'No se pudo sincronizar el favorito.');
      });
    },
    [idsFavoritos, usuario],
  );

  const quitarFavorito = useCallback(
    (productoId: string) => {
      const estabaPresente = idsFavoritos.includes(productoId);
      setIdsFavoritos((previo) => previo.filter((id) => id !== productoId));
      setError(null);

      if (!usuario || !estabaPresente) return;

      servicioFavoritos.quitarFavorito(usuario.id, productoId).catch((err) => {
        setIdsFavoritos((previo) => [productoId, ...previo]);
        setError(err instanceof Error ? err.message : 'No se pudo quitar el favorito.');
      });
    },
    [idsFavoritos, usuario],
  );

  const valor = useMemo<ValorFavoritosContext>(
    () => ({
      idsFavoritos,
      cantidadFavoritos: idsFavoritos.length,
      cargando,
      error,
      esFavorito,
      alternarFavorito,
      quitarFavorito,
    }),
    [idsFavoritos, cargando, error, esFavorito, alternarFavorito, quitarFavorito],
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}
