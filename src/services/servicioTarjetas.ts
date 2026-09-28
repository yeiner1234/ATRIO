import { CLAVES_ALMACENAMIENTO, servicioAlmacenamiento } from '@/services/storageService';
import type { DatosTarjeta, Tarjeta } from '@/types';

// Hoy las tarjetas viven en el dispositivo. Cuando exista la tabla `tarjetas` en
// Supabase, solo cambia el cuerpo de estas funciones.

function generarId(): string {
  return `tar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function leer(): Promise<Tarjeta[]> {
  const guardadas = await servicioAlmacenamiento.obtenerDato<Tarjeta[]>(CLAVES_ALMACENAMIENTO.tarjetas);
  return guardadas ?? [];
}

async function escribir(lista: Tarjeta[]): Promise<void> {
  await servicioAlmacenamiento.guardarDato(CLAVES_ALMACENAMIENTO.tarjetas, lista);
}

function conUnaPredeterminada(lista: Tarjeta[], idPredeterminada: string): Tarjeta[] {
  return lista.map((tarjeta) => ({ ...tarjeta, predeterminada: tarjeta.id === idPredeterminada }));
}

export const servicioTarjetas = {
  async obtenerTarjetas(): Promise<Tarjeta[]> {
    return leer();
  },

  async agregarTarjeta(datos: DatosTarjeta): Promise<Tarjeta> {
    const lista = await leer();
    const nueva: Tarjeta = { ...datos, id: generarId() };
    const conNueva = [...lista, nueva];
    const esPredeterminada = datos.predeterminada || lista.length === 0;
    await escribir(esPredeterminada ? conUnaPredeterminada(conNueva, nueva.id) : conNueva);
    return { ...nueva, predeterminada: esPredeterminada };
  },

  async eliminarTarjeta(id: string): Promise<void> {
    const lista = await leer();
    const eliminada = lista.find((tarjeta) => tarjeta.id === id);
    const restantes = lista.filter((tarjeta) => tarjeta.id !== id);
    // Si se borra la predeterminada, la primera que queda pasa a serlo.
    const siguiente =
      eliminada?.predeterminada && restantes.length > 0
        ? conUnaPredeterminada(restantes, restantes[0].id)
        : restantes;
    await escribir(siguiente);
  },

  async marcarPredeterminada(id: string): Promise<void> {
    await escribir(conUnaPredeterminada(await leer(), id));
  },
};
