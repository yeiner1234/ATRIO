import { supabase } from '@/lib/supabase';
import { campanaInicio } from '@/data/campana';
import type { CampanaInicio } from '@/types';

interface FilaCampana {
  etiqueta: string;
  titulo: string;
  texto_boton: string;
  categoria_destino: string;
  imagen_url: string | null;
}

function mapearFila(fila: FilaCampana): CampanaInicio {
  return {
    etiqueta: fila.etiqueta,
    titulo: fila.titulo,
    textoBoton: fila.texto_boton,
    categoriaDestino: fila.categoria_destino,
    imagenUrl: fila.imagen_url ?? undefined,
  };
}

export const servicioCampana = {
  // Nunca lanza: si Supabase no está configurado, la tabla está vacía, o la
  // consulta falla, se cae de vuelta al objeto fijo de src/data/campana.ts
  // — Inicio siempre tiene algo que mostrar (un carrusel de un solo slide),
  // la campaña nunca rompe la pantalla principal de la app.
  async obtenerCampanasActivas(): Promise<CampanaInicio[]> {
    if (!supabase) return [campanaInicio];

    const { data, error } = await supabase
      .from('campanas')
      .select('etiqueta, titulo, texto_boton, categoria_destino, imagen_url')
      .eq('activa', true)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('servicioCampana: no se pudieron cargar las campañas activas, se usa la de respaldo.', error);
      return [campanaInicio];
    }
    if (!data || data.length === 0) return [campanaInicio];

    return (data as FilaCampana[]).map(mapearFila);
  },
};
