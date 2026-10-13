# Context.md — INDUFOR SRL

> **Proyecto:** Sistema Integral de Gestión y Control de Producción Forestal, Logística y Consumos para Indufor SRL  
> **Propósito de este archivo:** servir como contexto técnico y funcional obligatorio para cualquier agente/IA o desarrollador que trabaje sobre la implementación codificada del sistema.  
> **Fuente funcional principal:** `TRABAJO PRACTICO FINAL - TERCER ADELANTO.docx.pdf`.  
> **Regla principal de trabajo:** **Auditar → Planificar → Programar**.
> **Consigna de la cátedra:** `C:\Users\roman\Desktop\Estudios\iAes\Sistemas\TP FINAL\TP_FINAL_SEMINARIO.md` (ver §24).  
> **Documentos complementarios:** [`docs/database.md`](docs/database.md) (esquema, §11–15), [`docs/discrepancias.md`](docs/discrepancias.md) (cotejo y decisiones pendientes, §29), [`docs/cambios-pdf.md`](docs/cambios-pdf.md) (correcciones pendientes del PDF).  
> **Último cotejo documental:** 2026-10-12. Se revisaron los requisitos, el modelo relacional, el diccionario, los DFD, los diagramas de secuencia/DER del PDF fuente y la consigna de la cátedra. El cotejo no constituye aprobación de las decisiones pendientes ni cierre de Fase 0.

---

## 1. Objetivo del sistema

Construir una aplicación web integral para Indufor SRL que reemplace el circuito híbrido actual basado en planillas físicas, fotografías, mensajes de WhatsApp, remitos en papel, transcripciones manuales y “cuadernitos”, centralizando la información operativa y gerencial.

El sistema debe cubrir, como mínimo:

- producción forestal diaria;
- asignación de usuarios a frentes de trabajo;
- maquinaria y vehículos;
- logística, viajes y remitos;
- horómetros y kilometrajes;
- fallas y mantenimiento;
- control preventivo de matafuegos;
- intercambio de datos con el **Sistema de Control de Gastos e Insumos**, que permanece como sistema externo;
- consolidación quincenal y mensual;
- dashboard y reportes gerenciales;
- trazabilidad, auditoría, seguridad y control de acceso por roles.

Las unidades/frentes operativos iniciales son:

1. Papel Misionero.
2. Bosques del Plata.
3. Prusia.

El sistema debe preservar la trazabilidad desde el dato generado en campo hasta su uso por Administración, Mantenimiento, Logística y Gerencia.

### 1.1 Límites y distinción respecto del sistema actual

Según la sección 1.4 del PDF (página física 3), quedan fuera del alcance inicial:

- liquidación formal de impuestos y presentaciones ante organismos fiscales;
- cálculo de haberes y liquidación detallada de sueldos;
- integración directa con sensores para telemetría automática, incluido JDLink.

Las fotos, WhatsApp, planillas y cuadernos describen el circuito actual; no implican una integración obligatoria con WhatsApp ni reconocimiento automático de imágenes en el nuevo sistema. El remito físico continúa como respaldo comercial y Administración incorpora sus datos para el cotejo digital.

También quedan fuera, por decisión del 2026-10-12 incorporada al Cuarto Adelanto del TP (D01, D02):

- el registro de cargas de combustible y lubricantes, el stock de tanques de despacho y su conciliación, que siguen en el Sistema de Control de Gastos e Insumos; el nuevo sistema solo importa su consolidado mensual (RF13);
- el registro estructurado de novedades de personal; las circunstancias que afectan la producción se consignan en las observaciones del parte diario.

---

## 2. Reglas de gobierno del desarrollo

### 2.1 Flujo obligatorio

Toda tarea debe ejecutarse en este orden:

**1. AUDITAR → 2. PLANIFICAR → 3. PROGRAMAR**

No se permite comenzar directamente por implementación.

### 2.2 Auditar

Antes de modificar código, esquema, UI, API o reglas de negocio, el agente debe:

- leer `Context.md`;
- leer `CLAUDE.md`;
- identificar el bounded context afectado;
- revisar ADRs existentes;
- revisar migraciones, modelos, endpoints, tests y componentes relacionados;
- identificar requerimientos funcionales y no funcionales afectados;
- identificar reglas de negocio y riesgos;
- verificar qué skills obligatorias aplican;
- detectar dependencias con otros bounded contexts;
- declarar cualquier ambigüedad antes de asumir una regla de negocio nueva.

### 2.3 Planificar

Antes de programar se debe producir un plan corto que indique:

- objetivo;
- bounded context;
- RF/RNF involucrados;
- archivos o capas a modificar;
- impacto en base de datos;
- impacto en API;
- impacto en frontend;
- permisos/RBAC;
- reglas de negocio;
- estrategia de tests;
- riesgos de regresión;
- necesidad o no de ADR.

### 2.4 Programar

Solo después de Auditar y Planificar:

- crear o actualizar los tests que definan el comportamiento esperado;
- implementar el cambio;
- ejecutar tests unitarios del cambio;
- ejecutar tests de integración relacionados;
- ejecutar tests de regresión del bounded context;
- ejecutar tests RBAC/seguridad cuando corresponda;
- ejecutar tests frontend/PWA cuando exista impacto visual, de navegación, cache o sincronización;
- ejecutar revisión de seguridad;
- ejecutar Design QA cuando exista UI;
- verificar migraciones;
- actualizar documentación;
- dejar el repositorio en estado coherente.

**No existe “cambio terminado” con tests pendientes, omitidos o fallando.**

### 2.5 Prohibiciones

No se debe:

- inventar reglas de negocio no respaldadas por requerimientos o ADR;
- acoplar lógica de dominio a controllers, componentes React o infraestructura;
- saltar validaciones de dominio;
- modificar el esquema directamente en producción;
- utilizar colores Tailwind arbitrarios en componentes cuando exista un token semántico;
- basar permisos únicamente en ocultar botones del frontend;
- usar el sistema externo de gastos e insumos como si fuera una tabla interna;
- comenzar una fase sin cumplir los criterios de salida de la fase anterior;
- generar código de aplicación durante la Fase 0.

---

## 3. Stack tecnológico obligatorio

### Backend

- **PHP**
- **Laravel**
- API HTTP versionada bajo `/api/v1`.
- **Laravel Sanctum** para autenticación de SPA/API salvo ADR que justifique un mecanismo diferente.
- Policies/Gates o capa de autorización equivalente para RBAC.
- Form Requests o DTOs equivalentes para validación de entrada.
- Eloquent únicamente como adaptador de persistencia; la lógica de negocio debe permanecer fuera de los modelos ORM.
- Jobs/queues para procesos no interactivos o integraciones cuando corresponda.
- Storage abstraction de Laravel para fotografías y archivos importados/exportados.

### Frontend

- **React** con **TypeScript** (modo `strict`).
- **Vite**.
- **SPA separada** del backend, autenticada con **Laravel Sanctum** (cookies SPA). La alternativa Inertia queda descartada porque el requisito PWA/offline exige que el frontend controle su propio Service Worker y cache; la decisión se formaliza en `docs/adr/ADR-001`.
- **React Router** para navegación.
- **TanStack Query** para estado del servidor (fetch, cache, reintentos, invalidación). **Zustand** solo para estado global de cliente que no provenga del servidor (por ejemplo, cola de envíos pendientes o preferencias de sesión).
- **React Hook Form + Zod** para formularios y validación en cliente. La validación de cliente es ayuda de UX; la validación autoritativa sigue en el backend.
- Cliente HTTP centralizado.
- Arquitectura frontend por features/bounded context; no organizar toda la aplicación solamente por tipo de archivo.

### PWA — requisito obligatorio

La aplicación debe construirse desde el inicio como **Progressive Web App (PWA)** y no agregarse como adaptación al final del proyecto.

Requisitos mínimos:

- implementación con `vite-plugin-pwa` (Workbox) salvo ADR en contrario;
- `manifest.webmanifest` correctamente configurado;
- Service Worker versionado;
- instalable en dispositivos móviles y escritorio compatibles;
- iconografía PWA en tamaños requeridos;
- estrategia explícita de cache;
- pantalla y comportamiento de actualización cuando exista una nueva versión;
- funcionamiento resiliente ante conexiones inestables propias del trabajo de campo;
- preservación temporal de formularios no enviados cuando sea técnicamente viable;
- detección visible de estado `online/offline`;
- nunca informar un registro como sincronizado hasta recibir confirmación del backend;
- reintentos controlados para operaciones pendientes;
- no cachear respuestas sensibles o información privada de manera insegura;
- limpiar/invalidar caches cuando la sesión o versión de aplicación lo requieran;
- pruebas específicas de instalación, actualización, cache y recuperación de conectividad.

La estrategia de persistencia offline de datos transaccionales debe definirse mediante ADR antes de implementarse. No se debe asumir que toda operación puede ejecutarse offline; cada bounded context debe declarar qué acciones admiten captura diferida y cuáles requieren conexión.

### UI

- **Tailwind CSS**
- Uso obligatorio de **design tokens semánticos**.
- No utilizar en vistas colores de intención directa como `bg-green-500`, `text-red-600`, etc. cuando representen significado de producto.

Valores definitivos, derivados del logo y verificados para contraste AA: [`docs/design-tokens.md`](docs/design-tokens.md). Componentes de React Bits elegidos: [`docs/ui-react-bits.md`](docs/ui-react-bits.md). Estructura de nombres:

```css
:root {
  --color-bg-canvas: ...;
  --color-bg-surface: ...;
  --color-bg-elevated: ...;

  --color-text-primary: ...;
  --color-text-secondary: ...;
  --color-text-muted: ...;
  --color-text-inverse: ...;

  --color-border-default: ...;
  --color-border-strong: ...;

  --color-action-primary: ...;
  --color-action-primary-hover: ...;

  --color-state-success: ...;
  --color-state-warning: ...;
  --color-state-danger: ...;
  --color-state-info: ...;

  --color-production-pulpable: ...;
  --color-production-aserrable: ...;

  --color-validation-pending: ...;
  --color-validation-approved: ...;
  --color-validation-correction: ...;
}
```

Los componentes deben consumir tokens semánticos, no valores visuales aislados.

#### Componentes base y React Bits

- **shadcn/ui** (Radix + Tailwind) es la base de componentes funcionales: formularios, selects, combobox/autocompletado, tablas, diálogos, date pickers, toasts. Se adopta porque consume variables CSS, compatible con los tokens semánticos.
- **React Bits** (`reactbits.dev`) se usa solo como acento visual: login, dashboard gerencial, estados vacíos y transiciones de bajo costo. No es una librería de formularios ni reemplaza a shadcn/ui.
- Al incorporar un componente de React Bits se deben reemplazar sus colores fijos por tokens semánticos y respetar `prefers-reduced-motion`.
- **Prohibido en pantallas de captura de campo** (producción, viajes, lecturas, matafuegos): animaciones pesadas o componentes que dependan de WebGL/canvas (`three`, `ogl`) o de librerías de animación grandes. Esas pantallas priorizan peso del bundle, batería y uso con conectividad inestable (RNF01, RNF02).
- Toda dependencia nueva que arrastre un componente de React Bits debe justificarse por su impacto en el tamaño del precache de la PWA.

### Base de datos

- **MySQL/MariaDB compatible**
- Motor: **InnoDB**
- Charset: **utf8mb4**
- Base de datos obligatoria: **`indufor_db`**
- Migraciones Laravel como única fuente de creación/evolución física del esquema.
- Integridad referencial mediante PK, FK, índices, constraints y transacciones.
- Modelo normalizado a **3FN** para el núcleo transaccional.

### Testing

El desarrollo es **test-gated**: ningún cambio se considera terminado mientras no haya pasado su batería de pruebas correspondiente.

- PHPUnit/Pest para backend.
- Tests unitarios del dominio.
- Tests de integración de persistencia/API.
- Tests de autorización.
- Tests de reglas de negocio críticas.
- **Vitest + React Testing Library** para componentes, hooks y flujos críticos del frontend.
- Tests específicos de PWA: manifest, Service Worker, cache, actualización y recuperación de conectividad.
- **Playwright** para E2E de los flujos principales antes de deploy (incluida emulación offline y de dispositivo móvil).

Los casos E2E de §20 alimentan la tabla de casos de prueba de la sección 8.1 del TP (ver §24).

#### Regla obligatoria por cambio

Todo cambio funcional, corrección, refactor o modificación de arquitectura debe:

1. definir antes de programar qué tests lo validarán;
2. crear o actualizar primero los tests unitarios correspondientes cuando exista lógica testeable;
3. implementar el cambio;
4. ejecutar la batería de tests afectada;
5. ejecutar tests de regresión del bounded context;
6. ejecutar tests de autorización/seguridad cuando corresponda;
7. ejecutar tests frontend/PWA si el cambio afecta interfaz, navegación, almacenamiento, cache o sincronización;
8. no cerrar la tarea mientras exista un test fallando.

**Un cambio con tests rojos está incompleto.**

#### Regla obligatoria por fase

Ninguna fase puede cerrarse únicamente porque las pantallas o endpoints funcionen manualmente. El cierre exige el **Gate transversal de testing** de §19. Si una fase introduce una regresión en una fase anterior, **la fase actual no puede considerarse terminada**.

### Calidad y herramientas

- Git.
- Pull Requests.
- ADRs.
- Linting/formatting.
- Análisis estático cuando esté disponible.
- CI obligatoria antes de merge a rama protegida.

---

## 4. Skills obligatorias

El uso de skills no es opcional. Antes de ejecutar una tarea el agente debe identificar y aplicar las skills correspondientes. En Claude Code las skills se activan por su `description`; `CLAUDE.md` repite la tabla de uso para que la selección no dependa solo de esa coincidencia.

### 4.1 Ubicación y formato

- Skills del proyecto: `.claude/skills/<nombre>/SKILL.md`, versionadas con el repositorio.
- Nombres en minúsculas y `kebab-case`, sin espacios, barras ni tildes.
- Se crean y modifican con la skill **`skill-creator`** de Claude Code. Cada skill declara en su `description` cuándo debe usarse y referencia las secciones de `Context.md` o `docs/` que protege, sin copiar su contenido.

### 4.2 Mapa de capacidades → skills

| Capacidad requerida | Skill en Claude Code | Origen |
|---|---|---|
| Arquitectura DDD/hexagonal | `clean-ddd-hexagonal` | Existente; copiada a `.claude/skills/` |
| Backend Laravel, API `/api/v1`, migraciones | `indufor-laravel-backend` | Proyecto |
| Esquema de datos y sincronía DER ↔ base | `indufor-laravel-backend` + `indufor-adr-docs` | Proyecto |
| RBAC (catálogo y matriz) | `indufor-domain-map` (catálogo) + `indufor-laravel-backend` (policies) | Proyecto |
| Guardián de reglas de negocio | skills de dominio `indufor-production-rules`, `indufor-logistics-remito-validation`, `indufor-maintenance-meter-rules`, `indufor-managerial-reporting` | Proyecto |
| Frontend React, PWA, tokens | `indufor-react-frontend` | Proyecto |
| Mobile / Field UX | `indufor-field-mobile-ux` | Proyecto |
| UI/UX general | `ui-ux-pro-max` | Existente (usuario) |
| Design QA y accesibilidad | `impeccable`, `design:accessibility-review` | Existentes |
| Testing QA | `indufor-testing-qa` | Proyecto |
| Security Review | `/security-review` | Integrada en Claude Code |
| Git / PR review | `/code-review` + reglas de §23 | Integrada en Claude Code |
| Documentación / ADR / sincronía con el PDF | `indufor-adr-docs` | Proyecto |

### 4.3 Regla de uso

Como mínimo:

- cambios de dominio → `clean-ddd-hexagonal` + skill de dominio del contexto afectado;
- cambios estructurales → `clean-ddd-hexagonal` + `indufor-domain-map`;
- cambios DB → `indufor-laravel-backend` + `indufor-adr-docs` (actualizar DER/diccionario del PDF);
- endpoints y permisos → `indufor-laravel-backend` + `indufor-domain-map`;
- frontend → `indufor-react-frontend`;
- interfaz → `ui-ux-pro-max`;
- interfaz de campo → `indufor-field-mobile-ux`;
- cambios de PWA, cache, instalación, actualización o sincronización → `indufor-react-frontend` + `indufor-field-mobile-ux` + `indufor-testing-qa` + `/security-review`;
- cierre visual → `impeccable` + `design:accessibility-review`;
- cualquier feature → `indufor-testing-qa`;
- cambios sensibles → `/security-review`;
- PR → `/code-review`;
- decisiones duraderas → `indufor-adr-docs`.

---

## 5. Fase 0 — Harness de codificación INDUFOR

**Esta fase ocurre antes de generar una sola línea de la aplicación.**

Objetivo: construir el entorno de gobierno para que los agentes no programen sin contexto, límites ni reglas.

Entregables obligatorios:

- `Context.md`;
- `CLAUDE.md`;
- estructura de ADRs;
- reglas de Git/PR;
- estrategia de testing;
- definición inicial de bounded contexts;
- definición de arquitectura hexagonal;
- catálogo de permisos;
- convención de errores y API;
- convención de design tokens;
- estrategia PWA inicial: manifest, Service Worker, cache, actualización, conectividad y política de sincronización;
- **8 skills de dominio del proyecto INDUFOR** (§5.1) y **4 skills técnicas** (§5.2);
- `clean-ddd-hexagonal` disponible en `.claude/skills/`.

### 5.1 Ocho skills específicas obligatorias del proyecto

Deben existir antes de iniciar Fase 1:

1. `indufor-domain-map`  
   Define lenguaje ubicuo, actores, bounded contexts, entidades y relaciones permitidas.

2. `indufor-production-rules`  
   Protege RF01–RF04: producción diaria, pulpable/aserrable, carga consolidada/individual, maquinaria, frente y soporte fotográfico.

3. `indufor-logistics-remito-validation`  
   Protege RF05–RF08: viaje, remito, cotejo, estados, validación exacta y solicitud de corrección.

4. `indufor-maintenance-meter-rules`  
   Protege RF09–RF12 y RNF05: horómetros, kilometrajes, lectura anterior, fallas, alertas y exportación.

5. `indufor-external-costs-integration`  
   Define el anti-corruption layer del Sistema de Control de Gastos e Insumos, importaciones, exportaciones, idempotencia y trazabilidad.

6. `indufor-field-mobile-ux`  
   Define formularios móviles, mínima escritura, autocompletado, selects, feedback, tolerancia a conexión inestable y prevención de pérdida silenciosa de datos.

7. `indufor-managerial-reporting`  
   Protege RF14–RF16: quincenas, cierres mensuales, filtros históricos, permisos de gerencia y consistencia de indicadores.

8. `indufor-traceability-audit`  
   Define auditoría de operaciones críticas, actor, fecha, entidad, cambio, origen y correlación de importaciones/exportaciones.

### 5.2 Cuatro skills técnicas del proyecto

1. `indufor-laravel-backend`  
   Capas hexagonales en Laravel, convención de API `/api/v1`, errores, paginación, Form Requests, Resources, Policies y política de migraciones.

2. `indufor-react-frontend`  
   Arquitectura React + TypeScript por features, TanStack Query, formularios, PWA, design tokens, shadcn/ui y uso acotado de React Bits.

3. `indufor-testing-qa`  
   Gates de testing por cambio y por fase, estrategia por capa, E2E mínimos y su correspondencia con la tabla de casos de prueba del TP.

4. `indufor-adr-docs`  
   ADRs y sincronía documental: todo cambio de esquema o de comportamiento se refleja en el PDF del TP (DER, modelo relacional, diccionario, secuencias) y en `docs/`.

### Gate de salida de Fase 0

No se habilita Fase 1 hasta que:

- existan las 8 skills de dominio y las 4 técnicas, creadas con `skill-creator`;
- exista `CLAUDE.md`;
- los bounded contexts estén documentados;
- arquitectura hexagonal esté definida;
- `indufor_db` tenga diseño físico inicial aprobado;
- exista catálogo RBAC inicial;
- exista checklist Auditar → Planificar → Programar.

---

## 6. `CLAUDE.md` obligatorio

Debe existir en la raíz del proyecto y funcionar como contrato operativo de los agentes. Claude Code lo carga en cada sesión, por eso debe ser breve y remitir a `Context.md`, `docs/` y las skills en lugar de duplicarlos. Si en el futuro se usa otro agente que lea `AGENTS.md`, ese archivo debe limitarse a importar o remitir a `CLAUDE.md`.

Como mínimo debe contener:

- propósito del proyecto;
- reglas de precedencia documental;
- flujo Auditar → Planificar → Programar;
- skills obligatorias;
- bounded contexts;
- ownership por contexto;
- arquitectura hexagonal;
- reglas de dependencias;
- contratos entre contextos;
- reglas de testing;
- reglas de seguridad;
- política de ADR;
- política de migraciones;
- política Git/PR;
- Definition of Done.

### 6.1 Bounded contexts iniciales

#### Identity & Access
Responsable de autenticación, usuarios, roles, permisos y autorización.

#### Frentes & Assignments
Responsable de frentes de trabajo y asignaciones históricas de usuarios.

#### Fleet & Machinery
Responsable de maquinaria, vehículos y tipos de unidad.

#### Production
Responsable de producción diaria, clasificación pulpable/aserrable y soportes.

#### Logistics
Responsable de viajes, remitos, validación cruzada y solicitudes de corrección.

#### Maintenance
Responsable de horómetros, kilometrajes, fallas y controles preventivos.

#### External Costs Integration
Responsable de intercambio con el Sistema de Control de Gastos e Insumos. Este bounded context es un **Anti-Corruption Layer** y no debe filtrar estructuras externas hacia el dominio interno.

#### Reporting & Management
Responsable de consolidaciones quincenales/mensuales, consultas históricas y dashboard gerencial.

#### Audit & Traceability
Capacidad transversal para acciones críticas e integraciones.

---

## 7. Arquitectura hexagonal obligatoria

Cada bounded context debe respetar, conceptualmente, la siguiente separación:

```text
Domain
├── Entities
├── ValueObjects
├── DomainServices
├── DomainEvents
└── Rules / Specifications

Application
├── UseCases
├── Commands
├── Queries
├── DTOs
└── Ports

Infrastructure
├── Persistence
│   ├── Eloquent Models
│   └── Repositories
├── ExternalSystems
├── Files
├── Notifications
└── Queue / Jobs

Interface
├── HTTP Controllers
├── Requests
├── Resources
└── Console / CLI
```

Reglas:

- Domain no depende de Laravel.
- Application depende del Domain y de puertos.
- Infrastructure implementa puertos.
- HTTP no contiene reglas de negocio.
- Eloquent no define la política del dominio.
- Un bounded context no accede directamente a tablas de otro contexto para ejecutar reglas de negocio; utiliza servicios de aplicación, puertos o consultas explícitamente autorizadas.
- Toda excepción arquitectónica requiere ADR.

---

## 8. Requerimientos funcionales oficiales

### Producción

- **RF01:** carga diaria de producción diferenciando estrictamente madera pulpable y aserrable.
- **RF02:** producción parametrizada por frente operativo, operario e ID de máquina.
- **RF03:** encargados de Papel Misionero y Bosques pueden reportar producción consolidada; operarios de Prusia pueden reportarla individualmente.
- **RF04:** permitir adjuntar respaldo fotográfico de monitor o planilla de campo. El adjunto es opcional en la Figura 9 y nullable en el diccionario; no se exige foto para toda carga.

### Logística y remitos

- **RF05:** registrar declaraciones digitales de viajes completadas por transportistas, indicando origen **Papel Misionero o Prusia** y destino. Bosques del Plata es frente de producción, pero no figura como origen habilitado en este RF; ampliarlo requiere un cambio de requerimiento aprobado.
- **RF06:** Administración debe asociar y cotejar cada declaración digital con el remito comercial.
- **RF07:** marcar automáticamente un viaje como `VALIDADO` solo cuando exista coincidencia exacta entre la declaración del camionero y los datos del remito físico cargado. No admitir aprobación manual que omita el cotejo ni tolerancias de negocio no aprobadas.
- **RF08:** generar una alerta o Solicitud de Corrección por incongruencias en volumen, tipo de madera o **ID de transportista**. El flujo de la Figura 10 y este proyecto materializan la Solicitud de Corrección; la falta del dato de transportista en el esquema del remito debe resolverse antes de implementar el cotejo.

### Mantenimiento

- **RF09:** registrar semanalmente horómetros de máquinas forestales y kilometrajes de vehículos livianos y camionetas, con corte operativo los lunes. La aplicación de esta captura a otras unidades debe definirse expresamente.
- **RF10:** notificar fallas instrumentales o sensores dañados al área de Mantenimiento.
- **RF11:** registrar mensualmente estado y vencimiento de matafuegos por cada **unidad móvil de la flota**. Qué tipos de maquinaria entran en ese universo debe definirse (ver D15 en `docs/discrepancias.md`).
- **RF12:** exportar **automáticamente** las lecturas instrumentales ya validadas al Sistema de Control de Gastos e Insumos para habilitar la liquidación externa. La Figura 11 valida, almacena y luego exporta; no establece una aprobación humana adicional obligatoria.

### Consolidación e integración

- **RF13:** importar el consolidado mensual de combustible del sistema externo, con litros y costos por máquina/vehículo.
- **RF14:** automatizar sumatoria quincenal de producción por unidad/frente y tipo de producto.
- **RF15:** unificar todos los datos operativos y de insumos en el reporte consolidado de gastos disponible para Gerencia **antes del día 15 de cada mes, correspondiente al período vencido**. La narrativa identifica el mes anterior; las menciones a entrega el día 15 describen el circuito actual y no sustituyen el plazo del nuevo sistema.
- **RF16:** filtros históricos de **producción y consumos** por rango de fechas, máquina, unidad/frente y operario. El formato mensual importado aún debe definir cómo soportará rango de fechas y operario para consumos.

---

## 9. Requerimientos no funcionales oficiales

- **RNF01 — Usabilidad/HCI:** la captura móvil debe estar optimizada para personal de campo con controles simples, autocompletado y desplegables que reduzcan tecleo y errores.
- **RNF02 — Rendimiento/Inmediatez:** los datos de campo deben quedar disponibles para Administración de manera inmediata, con sincronización automática.
- **RNF03 — Seguridad/RBAC:** autenticación y permisos por roles; información financiera/configuración crítica restringida a Gerencia y Administración.
- **RNF04 — Disponibilidad:** uptime superior a **99,5 %** dentro de la ventana operativa de la empresa.
- **RNF05 — Confiabilidad/Consistencia:** no permitir horómetros o kilometrajes inferiores a la lectura anterior de la misma unidad, **alertando en tiempo real** ante posibles números invertidos o entradas inconsistentes. Implica aviso inmediato en el formulario (cliente) además del rechazo autoritativo en el backend.

### Requisitos de ingeniería derivados

Estos requisitos complementan, pero no reemplazan, los RNF oficiales:

- trazabilidad de operaciones críticas;
- timestamps consistentes;
- transacciones para operaciones multi-registro;
- validación backend obligatoria;
- protección CSRF cuando aplique;
- hashing seguro de contraseñas;
- rate limiting para autenticación y endpoints sensibles;
- logs sin secretos;
- backups y procedimiento de restauración;
- idempotencia en importaciones;
- archivos con MIME/tamaño permitidos;
- ningún permiso debe depender solamente del frontend;
- errores internos no deben filtrar detalles sensibles al cliente.

---

## 10. RBAC inicial

Roles funcionales:

- `administracion`
- `gerencia`
- `encargado`
- `operario`
- `camionero`
- `logistica`
- `mantenimiento`

El nombre de una persona nunca debe reemplazar al rol técnico. Los códigos técnicos de rol (`rol.codigo`) van en minúsculas y sin tildes, como en la lista anterior; el nombre visible (`rol.nombre`) conserva la ortografía ("Administración", "Logística").

Ejemplos de permisos:

```text
users.view
users.create
users.update
users.disable

fronts.view
fronts.manage
fronts.assign-users

machinery.view
machinery.manage

production.view
production.create
production.update-own
production.view-all

logistics.trip.create
logistics.trip.view-own
logistics.trip.view-all
logistics.remito.create
logistics.remito.validate
logistics.correction.manage

maintenance.reading.create
maintenance.reading.view
maintenance.failure.view
maintenance.failure.manage
maintenance.extinguisher.create
maintenance.extinguisher.view

integration.export-readings
integration.import-costs
integration.view-history

reports.production
reports.operational
reports.financial

dashboard.management
settings.manage
audit.view
```

La matriz exacta Role → Permission está en [`docs/rbac.md`](docs/rbac.md) y debe cubrirse con tests.

No existe `production.validate`: los RF y el DER no definen un estado ni un flujo de validación de producción. Si Administración necesita aprobar partes, debe aprobarse primero el requerimiento (ver D16 en `docs/discrepancias.md`).

Precisiones de actores respaldadas por la sección 3.1 del PDF (página física 17):

- Administración es el usuario principal: recibe, valida, filtra y consolida información de todos los frentes. El acceso funcional a todos los frentes no supone permisos técnicos irrestrictos.
- Gerencia es un actor estratégico de consulta de producción quincenal, rendimiento e informes mensuales de costos. No se infieren permisos de edición operativa por ser Gerencia.
- Encargado carga producción consolidada de Papel Misionero y Bosques del Plata; Operario/Maquinista carga individualmente en Prusia. Según la sección 3.1 (Cuarto Adelanto), el Operario de Prusia también informa lecturas y novedades del estado del equipo, cubiertas por RF09–RF10.
- Camionero declara viajes y entrega documentación física; Logística aporta información y apoyo al cotejo. El RF06 asigna el cotejo a Administración, sin conceder automáticamente a Logística la validación final.
- Mantenimiento recibe alertas técnicas y supervisa controles preventivos mensuales.
- RNF03 reserva la visualización financiera y la modificación de configuración crítica a Administración y Gerencia; la matriz definirá los permisos concretos dentro de ese límite.

---

## 11–15. Diseño de base de datos

Ver [`docs/database.md`](docs/database.md): convenciones, esquema físico propuesto, tablas de integración, auditoría e índices.

---

## 16. Reglas de negocio críticas

### Producción

- Pulpable y aserrable son categorías distintas.
- El registro siempre debe poder rastrearse hasta usuario, frente y unidad.
- Los flujos consolidados e individuales deben coexistir sin perder origen.
- Los respaldos fotográficos son evidencia, no reemplazo de datos estructurados.

### Logística

- El viaje nace `PENDIENTE`.
- El remito es evidencia documental.
- La validación requiere cotejo.
- Inconsistencias relevantes generan `solicitud_correccion`.
- No corregir silenciosamente una declaración original sin trazabilidad.

### Mantenimiento

- Una lectura nueva no puede ser menor a la anterior de la misma métrica/unidad.
- Las fallas deben ser visibles para Mantenimiento.
- Solo lecturas validadas pueden exportarse.

### Sistema externo

- Es un terminador externo.
- No se accede a sus datos internos.
- Toda interacción pasa por un adaptador.
- Importaciones deben ser idempotentes.
- El dominio interno no debe depender del formato físico del proveedor.
- Los errores de integración no deben destruir datos válidos locales.

### Reportes

- Producción: consolidación quincenal.
- Consumos/gastos: ciclo mensual.
- El reporte mensual debe estar disponible antes del día 15.
- El consolidado mensual corresponde al período vencido (mes anterior), separado del cierre quincenal de producción.
- Los filtros históricos deben respetar RBAC.

---

## 17. Contrato API inicial

Base:

```text
/api/v1
```

Familias esperadas:

```text
/auth
/users
/roles
/permissions
/fronts
/front-assignments
/machinery
/machinery-types
/wood-types
/production
/logistics/trips
/logistics/remitos
/logistics/corrections
/maintenance/readings
/maintenance/extinguishers
/integrations/exports
/integrations/imports
/reports
/dashboard
/audit
```

Reglas:

- endpoints delgados;
- autorización backend obligatoria;
- recursos JSON consistentes;
- paginación en listados;
- filtros explícitos y validados;
- errores con formato uniforme;
- IDs internos no implican autorización;
- operaciones críticas dentro de transacciones;
- evitar endpoints genéricos que expongan el ORM.

---

## 18. Frontend Architecture

Organización sugerida:

```text
src/
├── app/
├── router/
├── shared/
│   ├── api/
│   ├── components/
│   ├── design-system/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── features/
    ├── auth/
    ├── users/
    ├── fronts/
    ├── machinery/
    ├── production/
    ├── logistics/
    ├── maintenance/
    ├── integrations/
    ├── reports/
    └── dashboard/
```

Cada feature debe encapsular:

- pages;
- components;
- API client;
- hooks de datos (TanStack Query) y store Zustand solo si corresponde;
- schemas/validators;
- tipos;
- tests.

### Reglas Mobile / Field UX

- mobile-first;
- controles táctiles amplios;
- minimizar escritura manual;
- teclado numérico para magnitudes;
- selects/autocomplete para frente, usuario, máquina y tipo;
- validación inmediata pero no agresiva;
- confirmar visualmente guardado exitoso;
- preservar temporalmente datos de formulario ante fallas de red;
- nunca mostrar “guardado” si el backend no confirmó persistencia;
- indicar claramente estado pendiente/sincronizado/error;
- accesibilidad básica WCAG;
- no depender exclusivamente del color para comunicar estados.

La aplicación es obligatoriamente PWA. Sin embargo, la estrategia de **operación transaccional offline** requiere ADR específico: ser PWA no significa que toda escritura pueda confirmarse sin conexión. Debe diferenciarse claramente entre datos guardados localmente como pendientes y datos efectivamente sincronizados con `indufor_db`.

---

## 19. Fases de construcción

> Para trabajar cada fase usar las fichas de `docs/fases.md` (alcance, qué cargar, incrementos y gate). Esta sección queda como referencia completa.

### Fase 0 — Harness de codificación INDUFOR

Sin código de aplicación. Entregables y gate de salida: §5.

### Fase 1 — Auth + Usuarios + Roles + Frentes

Incluye:

- autenticación;
- sesiones/tokens;
- usuarios;
- roles;
- permisos;
- asignación de roles;
- frentes;
- `frente_asignado`;
- maquinaria mínima necesaria como dependencia;
- guards/policies;
- auditoría inicial.

Criterio de salida:

- RBAC testeado;
- acceso por rol verificado;
- asignaciones históricas funcionando;
- ninguna ruta sensible depende solo del frontend.

### Fase 2 — Producción

Incluye RF01–RF04:

- producción diaria;
- tipos de madera;
- parametrización por frente/unidad/usuario;
- consolidado vs individual;
- respaldo fotográfico;
- filtros operativos;
- validaciones;
- mobile field UX.

Criterio de salida:

- flujo Papel/Bosques;
- flujo Prusia;
- tests de reglas;
- trazabilidad completa.

### Fase 3 — Logística + Remitos

Incluye RF05–RF08:

- viajes;
- remitos;
- cotejo;
- estados;
- solicitudes de corrección;
- auditoría;
- permisos.

Criterio de salida:

- no existe viaje `VALIDADO` sin cotejo válido;
- incongruencias reproducibles en tests;
- flujo de corrección completo.

### Fase 4 — Horómetros/Kilometrajes + Mantenimiento

Incluye RF09–RF11 y preparación de RF12:

- lecturas semanales;
- comparación con lectura anterior;
- fallas;
- alertas internas;
- matafuegos;
- panel técnico.

Criterio de salida:

- RNF05 cubierto con tests;
- lectura regresiva rechazada;
- falla trazable;
- control mensual operativo.

### Fase 5 — Sistema externo / importación-exportación

Incluye RF12–RF13:

- Anti-Corruption Layer;
- exportación de lecturas validadas;
- importación mensual;
- `integracion_lote`;
- `consumo_importado`;
- idempotencia;
- validación;
- manejo de errores;
- historial de intercambio.

Criterio de salida:

- reintento seguro;
- archivo duplicado no duplica consumos;
- errores parciales quedan auditados;
- ninguna dependencia de dominio apunta al formato externo.

### Fase 6 — Reportes y Dashboard gerencial

Incluye RF14–RF16:

- consolidado quincenal;
- consolidado mensual;
- filtros históricos;
- reportes operativos;
- reportes financieros;
- dashboard gerencial;
- permisos específicos.

Criterio de salida:

- totales reproducibles;
- filtros consistentes;
- permisos financieros verificados;
- consultas con rendimiento aceptable.

### Fase 7 — Hardening + QA + deploy

Incluye:

- Security Review;
- Testing QA completo;
- Design QA;
- performance;
- revisión de índices;
- backup/restore;
- logs;
- observabilidad;
- CI/CD;
- configuración productiva;
- migraciones;
- seed controlado;
- documentación;
- runbook;
- rollback;
- deploy.

No hay producción sin Gate de Fase 7.

### Gate transversal de testing para TODAS las fases

Antes de marcar cualquier fase como completada:

```text
[ ] Se agregaron/actualizaron tests unitarios
[ ] Pasan los tests unitarios del bounded context
[ ] Pasan los tests de integración relacionados
[ ] Pasan los tests RBAC correspondientes
[ ] Pasan los tests de regresión de fases anteriores
[ ] Pasan los tests frontend afectados
[ ] Pasan los tests PWA cuando corresponda
[ ] Pasan los E2E críticos definidos para la fase
[ ] CI completa en verde
[ ] No existen tests skipped/disabled sin justificación documentada
```

La falla de cualquiera de estos puntos bloquea el cierre de la fase.

---

## 20. Estrategia de tests por capa

### Domain

- reglas puras;
- transiciones de estado;
- validación de lecturas;
- reglas de cotejo;
- periodos y consolidaciones.

### Application

- use cases;
- autorización de caso de uso;
- coordinación de repositorios;
- transacciones.

### Infrastructure

- repositorios;
- mappings Eloquent ↔ Domain;
- archivos;
- integraciones.

### API

- autenticación;
- autorización;
- validaciones;
- respuestas;
- filtros;
- paginación.

### Frontend

- formularios;
- estados;
- errores;
- permisos visuales;
- componentes críticos.

### PWA

- manifest válido;
- instalación;
- registro y actualización del Service Worker;
- invalidación de cache;
- navegación con conectividad degradada;
- comportamiento offline permitido;
- recuperación al volver `online`;
- prevención de duplicados durante reintentos;
- diferenciación visible entre `pendiente`, `sincronizando`, `sincronizado` y `error`;
- seguridad de datos almacenados temporalmente en cliente.

### E2E mínimos

1. Encargado registra producción consolidada.
2. Operario de Prusia registra producción individual.
3. Camionero registra viaje → Administración carga remito → viaje validado.
4. Remito incongruente → solicitud de corrección.
5. Lectura válida → persistencia.
6. Lectura inferior → rechazo.
7. Falla → notificación/visibilidad para mantenimiento.
8. Importación mensual → consolidado disponible.
9. Gerencia consulta dashboard.
10. Usuario sin permiso intenta acceder a reporte financiero → acceso denegado.

---

## 21. Seguridad

Obligatorio:

- contraseñas hasheadas;
- secretos solo en `.env`;
- `.env.example` sin secretos;
- protección contra mass assignment;
- sanitización/escape donde aplique;
- uploads validados;
- autorización backend;
- rate limiting;
- logging de operaciones críticas;
- evitar PII innecesaria en logs;
- consultas parametrizadas mediante ORM/query builder;
- CORS explícito;
- cookies/tokens seguros según entorno;
- rotación de credenciales;
- backups cifrados cuando la infraestructura lo permita.

Todo hallazgo crítico o alto de `/security-review` bloquea merge.

---

## 22. ADRs obligatorios

Crear `docs/adr/`.

ADR requerido para decisiones como:

- SPA separada vs Inertia (**decidido: SPA separada + Sanctum**, ver §3; ADR-001 pendiente de redacción);
- estrategia exacta de autenticación;
- persistencia de archivos;
- offline/PWA;
- mecanismo de notificaciones;
- formato del intercambio con Sistema de Gastos e Insumos;
- cambios de cardinalidad respecto del DER;
- nuevas tablas de dominio;
- cache;
- queues;
- infraestructura/deploy.

Formato sugerido:

```text
# ADR-XXX — Título
Status:
Date:
Context:
Decision:
Alternatives:
Consequences:
Affected bounded contexts:
Migration/rollback:
```

---

## 23. Git / PR

Reglas:

- ramas cortas por feature/fix;
- commits pequeños y descriptivos;
- ninguna migración destructiva sin estrategia;
- PR debe indicar RF/RNF involucrados;
- PR debe incluir evidencia de tests;
- PR debe declarar cambios DB;
- PR debe declarar impacto RBAC;
- PR debe declarar si requiere ADR;
- no merge con tests fallando;
- PR debe declarar si cambia el DER o un diagrama del PDF (§24);
- `/code-review` obligatorio antes de merge.

Definition of Done: checklist de §27.

---

## 24. Consigna de la cátedra (TP Final — Seminario)

Fuente: `C:\Users\roman\Desktop\Estudios\iAes\Sistemas\TP FINAL\TP_FINAL_SEMINARIO.md` y planificación de Seminario 2026. El sistema es la parte construida del TP; su evaluación depende de estas reglas, que están por encima de cualquier preferencia técnica de este documento.

### 24.1 Criterios obligatorios y motivos de desaprobación

- El sistema debe funcionar y persistir en base de datos.
- **Todos los requerimientos definidos deben estar implementados** (RF01–RF16).
- El Diagrama de Contexto y el DFD Nivel 0 representan el **sistema actual** relevado, coherentes con la narrativa.
- **El DER debe representar el modelo de datos del sistema desarrollado y coincidir con la base de datos implementada.**
- Debe existir coherencia en la cadena: sistema actual → problemas → requerimientos → diseño → sistema implementado.
- Se desaprueba por: sistema no funcional, ausencia de base de datos, inconsistencia entre análisis, requerimientos e implementación, diagramas incorrectos, trabajo genérico o **falta de evidencia del desarrollo**.

### 24.2 Consecuencias para el desarrollo

- **DER = base implementada.** Toda tabla de dominio creada por migraciones debe figurar en la sección 5 del PDF (DER, modelo relacional, normalización y diccionario). Esto incluye las extensiones de `docs/database.md`: tablas RBAC, credenciales de `usuario`, `integracion_lote`, `consumo_importado`, `auditoria_evento` y cualquier tabla que resulte de resolver discrepancias. Las tablas de infraestructura del framework (`migrations`, `sessions`, `cache`, `jobs`, `failed_jobs`, `password_reset_tokens`, `personal_access_tokens`) no son del dominio y se declaran como tales en la sección 6 del TP.
- **RF12 y RF13 deben poder demostrarse.** Si no hay acceso real al Sistema de Control de Gastos e Insumos, el adaptador de integración se implementa sobre intercambio de archivos con un simulador documentado (ver D13).
- **Secuencias = flujos implementados.** Si la implementación cambia un flujo de las Figuras 9–11, se actualiza el diagrama.
- **Evidencia del desarrollo.** Historial de Git con commits pequeños y descriptivos, PRs que citan RF/RNF, y tests ejecutables.
- La planificación admite el **uso de herramientas basadas en IA** como apoyo (Unidad 5); el alumno sigue siendo responsable de comprender y defender cada decisión.

### 24.3 Secciones del TP que el desarrollo debe alimentar

| Sección del TP | Fuente en el proyecto |
|---|---|
| 6.1 Arquitectura de la solución | §3, §7 y ADRs |
| 6.2 Tecnologías utilizadas | §3 |
| 6.3 Funcionalidades implementadas | Matriz RF ↔ funcionalidad mantenida al cerrar cada fase |
| 6.4 Capturas del sistema | Capturas de las pantallas principales al cerrar cada fase |
| 7.1–7.2 Requisitos e instalación | `README.md` del repositorio |
| 7.3 Manual de usuario | Flujos principales por rol |
| 8.1 Casos de prueba | E2E mínimos de §20 y tests de reglas críticas |
| 8.2 Resultados de validación | Reporte de la suite y CI |

### 24.4 Correcciones pendientes del PDF

Las correcciones al documento entregado (DFD, DER, secciones faltantes de la plantilla, inconsistencias) se registran en [`docs/cambios-pdf.md`](docs/cambios-pdf.md). Se aplican sobre el documento fuente en Google Drive y los diagramas en diagrams.net, no sobre el PDF exportado.

---

## 25. Fuente de verdad y precedencia

En caso de conflicto, utilizar el siguiente orden:

1. consigna y criterios obligatorios de la cátedra (§24);
2. requerimiento funcional/no funcional vigente aprobado;
3. ADR aprobado más reciente;
4. `Context.md` y `docs/`;
5. `CLAUDE.md`;
6. skills específicas de INDUFOR;
7. tests ejecutables;
8. implementación existente.

Una divergencia entre código y requerimiento no se resuelve adaptando silenciosamente el requerimiento al código. Debe auditarse y documentarse.

Dentro del PDF, distinguir la descripción del sistema actual de los requisitos del nuevo sistema. Para el comportamiento futuro rigen los RF/RNF de las secciones 3.2–3.3; secuencias, DER y diccionario aportan detalle, pero sus omisiones no anulan un RF. Si el alcance narrativo introduce capacidades sin desarrollo en RF/DER, registrar la discrepancia y resolverla mediante definición funcional aprobada. Un ADR no puede, por sí solo, cambiar un requerimiento de mayor precedencia.

---

## 26. Checklist obligatorio antes de cada tarea

```text
[ ] Leí Context.md
[ ] Leí CLAUDE.md
[ ] Identifiqué bounded context
[ ] Identifiqué RF/RNF
[ ] Apliqué skills correspondientes
[ ] Audité implementación actual
[ ] Revisé reglas de negocio
[ ] Revisé RBAC
[ ] Revisé impacto DB/API/UI
[ ] Planifiqué
[ ] Definí tests
[ ] Identifiqué qué tests unitarios debo crear/actualizar antes del cierre
[ ] Revisé impacto PWA/offline/cache/sincronización
[ ] Revisé si cambia el DER o un diagrama del PDF
[ ] Recién ahora puedo programar
```

---

## 27. Checklist obligatorio antes de cerrar una tarea

```text
[ ] Tests unitarios creados/actualizados
[ ] Tests ejecutados
[ ] Tests de regresión ejecutados
[ ] Tests PWA ejecutados si corresponde
[ ] CI en verde
[ ] Reglas de negocio cubiertas
[ ] Autorización backend verificada
[ ] Migraciones verificadas
[ ] /security-review realizado
[ ] Design QA realizado si hubo UI (impeccable + accessibility-review)
[ ] Documentación actualizada
[ ] ADR creado/actualizado si corresponde
[ ] PDF/DER/diagramas actualizados o anotados en docs/cambios-pdf.md si corresponde
[ ] /code-review realizado
[ ] No quedan errores silenciosos ni TODO críticos
```

---

## 28. Principio final

El objetivo no es “hacer pantallas y CRUDs”.

El proyecto debe construir un sistema confiable que convierta operaciones de campo en información estructurada y trazable para Administración, Logística, Mantenimiento y Gerencia.

Por lo tanto, toda decisión técnica debe proteger cinco propiedades:

**integridad del dato + trazabilidad + claridad operativa + resiliencia de campo/PWA + capacidad de evolución.**

---

## 29. Cotejo con el PDF fuente

Ver [`docs/discrepancias.md`](docs/discrepancias.md): matriz de correspondencia RF/RNF ↔ páginas del PDF y registro de discrepancias D01–D14.
