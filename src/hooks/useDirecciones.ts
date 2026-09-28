import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { servicioDirecciones } from '@/services/servicioDirecciones';
import type { DatosDireccion, Direccion } from '@/types';
import { useSeleccionCheckout } from './useSeleccionCheckout';

export function useDirecciones() {
  const { direccionSeleccionadaId, seleccionarDireccion } = useSeleccionCheckout();
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDirecciones(await servicioDirecciones.obtenerDirecciones());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las direcciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  const crear = useCallback(
    async (datos: DatosDireccion) => {
      const nueva = await servicioDirecciones.crearDireccion(datos);
      await recargar();
      return nueva;
    },
    [recargar],
  );

  const actualizar = useCallback(
    async (id: string, datos: DatosDireccion) => {
      const actualizada = await servicioDirecciones.actualizarDireccion(id, datos);
      await recargar();
      return actualizada;
    },
    [recargar],
  );

  const eliminar = useCallback(
    async (id: string) => {
      await servicioDirecciones.eliminarDireccion(id);
      await recargar();
    },
    [recargar],
  );

  // Dirección efectiva: la elegida, si no la predeterminada, si no la primera.
  const direccionSeleccionada = useMemo<Direccion | null>(
    () =>
      direcciones.find((direccion) => direccion.id === direccionSeleccionadaId) ??
      direcciones.find((direccion) => direccion.predeterminada) ??
      direcciones[0] ??
      null,
    [direcciones, direccionSeleccionadaId],
  );

  return {
    direcciones,
    cargando,
    error,
    direccionSeleccionada,
    seleccionarDireccion,
    crear,
    actualizar,
    eliminar,
  };
}
