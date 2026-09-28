import { useCallback, useEffect, useState } from 'react';
import { servicioAdmin } from '@/services/servicioAdmin';
import type { ReporteAdmin } from '@/types';

export function useReportesAdmin() {
  const [reporte, setReporte] = useState<ReporteAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    servicioAdmin
      .obtenerReporteGeneral()
      .then(setReporte)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudo generar el reporte.');
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { reporte, cargando, error, recargar: cargar };
}
