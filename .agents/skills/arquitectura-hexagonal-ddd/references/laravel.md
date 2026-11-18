# Perfil Laravel

Aplicar cuando Laravel esté confirmado. Leer `composer.json`, `composer.lock`, manifiestos frontend y convenciones existentes. Consultar versiones compatibles antes de introducir APIs. Livewire, Filament, AdminLTE, Blade, una SPA y el motor SQL son decisiones del proyecto, no requisitos de este perfil.

- Estructura orientativa: `src/<Contexto>/{Domain,Application,Infrastructure,UI}` y composición en proveedores. Adaptar autoload y registro de migraciones al repositorio autorizado.
- Domain y Application son PHP sin facades, Eloquent, helpers globales, tipos HTTP, paginadores Laravel ni SDKs. Pasar datos simples/DTOs y contratos de identidad, reloj, logging, transacción y persistencia cuando sean necesarios.
- Eloquent, migraciones, seeders y gateways pertenecen a Infrastructure. Controladores, recursos administrativos y componentes Livewire son adaptadores de entrada; también CRUD, bulk actions, imports y relaciones que escriben invocan casos de uso.
- El proveedor conecta implementaciones a interfaces; el contenedor no sustituye dependencias explícitas dentro del núcleo. Un evento de dominio puro no implementa contratos Laravel; el adaptador coordina su entrega tras el commit cuando corresponda.
- Usar puertos transaccionales y consultas/bloqueos de infraestructura según invariantes y motor. Un test SQLite no acredita el comportamiento concurrente del motor SQL de producción.
- Pruebas según lo instalado: PHPUnit/Pest para dominio/casos/adaptadores, pruebas de acciones y permisos de UI si existen y build del frontend cuando cambie. No ejecutar migraciones o seeders sobre datos existentes durante la preparación del proyecto.
