# Perfil Flutter

Aplicar cuando Flutter esté confirmado. Revisar `pubspec.yaml`, `pubspec.lock`, plataformas destino y código existente. Gestor de estado, navegación, persistencia y backend se consultan; este perfil no impone Riverpod, Bloc, Firebase ni una arquitectura de servidor.

- Estructura orientativa por contexto en `lib/<contexto>/{domain,application,infrastructure,presentation}`. El núcleo de Dart no importa Flutter, widgets, gestores de estado, clientes HTTP, bases locales ni SDKs de plataforma.
- Widgets y controladores de presentación capturan eventos y presentan estados; llaman casos de uso. Los providers/blocs/notifiers no concentran invariantes de negocio ni se convierten en localizadores de servicios del núcleo.
- Repositorios y contratos externos se definen desde el núcleo; adaptadores HTTP/almacenamiento/mappers viven en Infrastructure. La composición construye las dependencias según la solución confirmada.
- Una app cliente no puede garantizar por sí sola autorización de servidor, cupos globales o una transacción distribuida. Especificar las invariantes que debe proteger el backend; offline, caché, reintentos y conflictos se diseñan cuando el producto los necesita.
- Probar dominio y casos con Dart, adaptadores con dobles/contratos, y widgets/recorridos en las plataformas acordadas. `flutter analyze` y un build prueban aspectos distintos de una aceptación funcional. El arranque del kit no ejecuta `flutter create` sin un pedido que lo incluya.
