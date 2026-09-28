import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LayoutAdmin() {
  const { usuario, listo } = useAuth();
  const esAdministrador = usuario?.rol === 'administrador';

  useEffect(() => {
    if (!listo) return;
    if (!usuario) router.replace('/(auth)/login');
    else if (!esAdministrador) router.replace('/(tabs)');
  }, [esAdministrador, listo, usuario]);

  if (!listo || !esAdministrador) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
