import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccionesAdmin, NavegacionAdmin } from '@/components/admin/NavegacionAdmin';
import { TarjetaIndicador } from '@/components/admin/TarjetaIndicador';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { ESPACIO, MEDIDAS, TIPOGRAFIA } from '@/constants/theme';
import { useReportesAdmin } from '@/hooks/useReportesAdmin';
import { useTema } from '@/hooks/useTema';
import type { ConteoNombre } from '@/types';
import { formatearSoles } from '@/utils/moneda';

function ListaConteo({ titulo, items }: { titulo: string; items: ConteoNombre[] }) {
  const { colores } = useTema();
  return (
    <View style={styles.seccion}>
      <Text style={[styles.tituloSeccion, { color: colores.textoSecundario }]}>{titulo}</Text>
      {items.length === 0 ? (
        <Text style={[styles.vacio, { color: colores.textoSecundario }]}>Aún no hay datos suficientes.</Text>
      ) : (
        <View style={[styles.tarjetaLista, { backgroundColor: colores.blanco, borderColor: colores.borde }]}>
          {items.map((item, indice) => (
            <View
              key={item.nombre}
              style={[
                styles.filaConteo,
                { borderBottomColor: colores.borde },
                indice === items.length - 1 && styles.sinBorde,
              ]}
            >
              <Text style={[styles.nombreConteo, { color: colores.tinta }]} numberOfLines={1}>
                {indice + 1}. {item.nombre}
              </Text>
              <Text style={[styles.valorConteo, { color: colores.textoSecundario }]}>
                {item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Reportes admin (Erick): ventas, productos más vendidos, categorías más
// vendidas y resumen general — calculado sobre pedidos reales de Supabase
// (excluye pedidos cancelados). No incluye exportación todavía.
export default function PantallaReportes() {
  const { colores } = useTema();
  const { reporte, cargando, error, recargar } = useReportesAdmin();

  return (
    <View style={[styles.pantalla, { backgroundColor: colores.papel }]}>
      <SafeAreaView edges={['top']} style={styles.barraSuperior}>
        <AccionesAdmin />
      </SafeAreaView>
      <NavegacionAdmin />
      <EncabezadoPantalla titulo="Reportes" subtitulo="VENTAS Y DESEMPEÑO" />

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        {cargando ? (
          <Text style={[styles.estado, { color: colores.textoSecundario }]}>Generando reporte…</Text>
        ) : error ? (
          <View style={styles.seccion}>
            <Text style={[styles.estado, { color: colores.arcilla }]}>{error}</Text>
            <Text style={[styles.reintentar, { color: colores.tinta }]} onPress={recargar}>
              Reintentar
            </Text>
          </View>
        ) : !reporte ? null : (
          <>
            <View style={styles.grid}>
              <TarjetaIndicador
                titulo="Ventas totales"
                valor={formatearSoles(reporte.ventasTotales)}
                icono="cash-outline"
              />
              <TarjetaIndicador titulo="Pedidos" valor={String(reporte.pedidosTotales)} icono="receipt-outline" />
              <TarjetaIndicador
                titulo="Ticket promedio"
                valor={formatearSoles(reporte.ticketPromedio)}
                icono="stats-chart-outline"
              />
            </View>

            <ListaConteo titulo="PRODUCTOS MÁS VENDIDOS" items={reporte.productosMasVendidos} />
            <ListaConteo titulo="CATEGORÍAS MÁS VENDIDAS" items={reporte.categoriasMasVendidas} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barraSuperior: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: MEDIDAS.margenLateral,
    paddingTop: ESPACIO.sm,
  },
  contenido: {
    paddingHorizontal: MEDIDAS.margenLateral,
    paddingTop: ESPACIO.base,
    paddingBottom: ESPACIO.xxl,
    gap: MEDIDAS.separacionSecciones,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.sm },
  seccion: { gap: ESPACIO.md },
  tituloSeccion: { fontFamily: TIPOGRAFIA.monoFuerte, fontSize: 11, letterSpacing: 1.2 },
  vacio: { fontFamily: TIPOGRAFIA.cuerpo, fontSize: 12.5, lineHeight: 18 },
  tarjetaLista: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  filaConteo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ESPACIO.sm,
    paddingHorizontal: ESPACIO.base,
    paddingVertical: ESPACIO.md,
    borderBottomWidth: 1,
  },
  sinBorde: { borderBottomWidth: 0 },
  nombreConteo: { flex: 1, fontFamily: TIPOGRAFIA.cuerpo, fontSize: 13 },
  valorConteo: { fontFamily: TIPOGRAFIA.mono, fontSize: 12 },
  estado: { fontFamily: TIPOGRAFIA.cuerpo, fontSize: 13, textAlign: 'center', marginTop: ESPACIO.xl },
  reintentar: {
    fontFamily: TIPOGRAFIA.etiqueta,
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: ESPACIO.sm,
  },
});
