# ATRIO

App de comercio en **React Native + Expo + TypeScript**, con navegación basada en **Expo Router**.

## Puesta en marcha

```bash
npm install
# Ajusta las versiones de los paquetes nativos a las del SDK de Expo instalado:
npx expo install --fix
npm start
```

Luego abre la app en Expo Go, un emulador Android / iOS o el navegador (`w`).

### Usuarios de prueba (datos simulados)

| Rol      | Correo             | Contraseña |
| -------- | ------------------ | ---------- |
| Cliente  | `cliente@atrio.com`| `123456`   |
| Admin    | `admin@atrio.com`  | `123456`   |

## Arquitectura

```
app/                  Navegación y pantallas (Expo Router, file-based routing)
  _layout.tsx         Layout raíz: providers globales + Stack
  index.tsx           Redirección según sesión
  (auth)/             Login, registro y recuperación de contraseña
  (tabs)/             Inicio, catálogo, favoritos, carrito, perfil
  producto/[id].tsx   Detalle de producto
  checkout / pago / confirmacion   Flujo de compra
  pedidos.tsx         Historial de pedidos
  configuracion.tsx   Preferencias de la cuenta
  admin/              Panel de administración (solo rol admin)

src/
  components/   UI reutilizable (common, products, cart, navigation)
  hooks/        Acceso a estado y lógica desde las pantallas
  context/      Estado global (Auth, Cart, Favorites) + AppProviders
  services/     Acceso a datos: auth, productos, pedidos, almacenamiento, httpClient
  data/         Datos simulados (productos, usuarios)
  types/        Tipos de dominio (Product, User, CartItem, Order)
  constants/    colors, theme y config de entorno
  utils/        Validadores y formato de moneda

assets/         Imágenes, iconos y fuentes
```

### Reglas de la arquitectura

- **`app/` solo orquesta**: las pantallas no contienen lógica compleja. El fetching,
  el filtrado y la persistencia viven en `src/hooks`, `src/context` y `src/services`.
- **Un único punto de persistencia**: `src/services/storageService.ts`. Ningún otro
  archivo importa `AsyncStorage` o `SecureStore` directamente.
- **Componentes reutilizables** en `src/components`, agrupados por dominio.

## Conectar backend real

Todo está preparado para reemplazar los datos simulados:

1. Define `EXPO_PUBLIC_API_URL` en un archivo `.env`.
2. `src/constants/config.ts` detecta la variable y desactiva el modo mock
   (`useMockData`).
3. Los servicios (`authService`, `productService`, `orderService`) ya tienen la rama
   que llama a la API a través de `src/services/httpClient.ts`, que adjunta el token
   almacenado por `storageService`.

No hace falta tocar las pantallas ni los contextos.

## Archivos añadidos sobre el esquema base (con motivo técnico)

- `src/context/AppProviders.tsx` — agrupa los providers para no ensuciar `app/_layout.tsx`.
- `src/services/httpClient.ts` — cliente `fetch` compartido para no repetir la lógica
  de token/headers en cada servicio.
- `src/services/orderService.ts` — el ciclo de pedidos pertenece a la capa de servicios,
  igual que auth y productos (evita meter esa lógica en `app/checkout` / `app/pago`).
- `src/hooks/useProducts.ts` y `src/hooks/useOrders.ts` — sacan de las pantallas el
  estado de carga y el filtrado, siguiendo la regla "sin lógica compleja en `app/`".
- `src/data/usuarios.ts` — datos simulados de autenticación (mismo criterio que
  `productos.ts`).
- `src/constants/config.ts` — configuración de entorno (mock vs API).

