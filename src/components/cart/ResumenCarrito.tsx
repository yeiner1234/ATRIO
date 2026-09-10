import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { ESPACIO, RADIO, TIPOGRAFIA } from '@/constants/theme';
import type { ResumenCompra } from '@/types';
import { formatearSoles } from '@/utils/moneda';

interface PropiedadesResumenCarrito {
  resumen: ResumenCompra;
}

interface PropiedadesFila {
  etiqueta: string;
  valor: string;
  acento?: boolean;
  total?: boolean;
}

function Fila({ etiqueta, valor, acento, total }: PropiedadesFila) {
  return (
    <View style={styles.fila}>
      <Text style={[styles.etiqueta, total && styles.etiquetaTotal]}>{etiqueta}</Text>
      <Text
        style={[
          styles.valor,
          acento && styles.valorAcento,
          total && styles.valorTotal,
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}

export function ResumenCarrito({ resumen }: PropiedadesResumenCarrito) {
  return (
    <View style={styles.contenedor}>
      <Fila etiqueta="Subtotal" valor={formatearSoles(resumen.subtotal)} />
      {resumen.descuento > 0 ? (
        <Fila
          etiqueta="Descuento"
          valor={`− ${formatearSoles(resumen.descuento)}`}
          acento
        />
      ) : null}
      <Fila etiqueta="IGV (18 % incluido)" valor={formatearSoles(resumen.igv)} />
      <View style={styles.separador} />
      <Fila etiqueta="Total" valor={formatearSoles(resumen.total)} total />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: COLORS.blanco,
    borderRadius: RADIO.resumen,
    padding: ESPACIO.base,
    gap: ESPACIO.md,
  },
  fila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  etiqueta: { fontFamily: TIPOGRAFIA.cuerpo, fontSize: 13, color: COLORS.textoSecundario },
  etiquetaTotal: { fontFamily: TIPOGRAFIA.titulo, fontSize: 14, color: COLORS.tinta },
  valor: { fontFamily: TIPOGRAFIA.mono, fontSize: 13, color: COLORS.tinta },
  valorAcento: { color: COLORS.arcilla },
  valorTotal: { fontFamily: TIPOGRAFIA.monoFuerte, fontSize: 16, color: COLORS.tinta },
  separador: { height: 1, backgroundColor: COLORS.borde },
});
