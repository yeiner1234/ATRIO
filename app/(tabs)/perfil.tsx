import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ESPACIO, MEDIDAS, TIPOGRAFIA } from '@/constants/theme';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { FilaOpcionPerfil } from '@/components/profile/FilaOpcionPerfil';
import { useAuth } from '@/context/AuthContext';
import { usePerfil } from '@/hooks/usePerfil';
import { useTema } from '@/hooks/useTema';

export default function PantallaPerfil() {
  const {
    irAMisPedidos,
    irAFavoritos,
    irADirecciones,
    irAMetodosPago,
    irAConfiguracion,
    irACentroAyuda,
    cerrarSesion,
  } = usePerfil();
  const { usuario } = useAuth();
  const { colores } = useTema();

  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: colores.papel }]} edges={['top']}>
      <ScrollView>
        <EncabezadoPantalla titulo="Perfil" />

        <View style={styles.tarjetaUsuario}>
          <Text style={styles.nombre}>{usuario?.nombre ?? 'Usuario'}</Text>
          <Text style={styles.dato}>{usuario?.email ?? ''}</Text>
          <Text style={styles.dato}>{usuario?.celular ?? ''}</Text>
          <Text style={styles.dato}>{usuario?.rol === 'administrador' ? 'ADMINISTRADOR' : 'CLIENTE'}</Text>
        </View>

        <View style={styles.seccion}>
          <FilaOpcionPerfil icono="receipt-outline" texto="Mis pedidos" onPress={irAMisPedidos} />
          <FilaOpcionPerfil icono="heart-outline" texto="Favoritos" onPress={irAFavoritos} />
          <FilaOpcionPerfil icono="location-outline" texto="Direcciones" onPress={irADirecciones} />
          <FilaOpcionPerfil icono="card-outline" texto="Métodos de pago" onPress={irAMetodosPago} />
          <FilaOpcionPerfil icono="settings-outline" texto="Configuración" onPress={irAConfiguracion} />
          <FilaOpcionPerfil icono="help-circle-outline" texto="Centro de ayuda" onPress={irACentroAyuda} />
        </View>

        <View style={styles.seccion}>
          <FilaOpcionPerfil
            icono="log-out-outline"
            texto="Cerrar sesión"
            onPress={cerrarSesion}
            destructivo
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  tarjetaUsuario: {
    paddingHorizontal: MEDIDAS.margenLateral,
    paddingBottom: ESPACIO.lg,
    gap: 2,
  },
  nombre: { fontFamily: TIPOGRAFIA.titulo, fontSize: 18 },
  dato: { fontFamily: TIPOGRAFIA.mono, fontSize: 12 },
  seccion: { marginTop: ESPACIO.lg },
});
