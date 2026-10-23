# Esquema de datos — `indufor_db`

> Extraído de `Context.md` (secciones 11–15). Mantiene la numeración original para no romper referencias.
> **Regla de la cátedra:** el DER del PDF (sección 5) debe coincidir con la base implementada. Toda tabla de este documento que no figure en el DER del PDF debe agregarse al DER, al modelo relacional y al diccionario antes de la entrega (ver `Context.md` §24).

## 11. Diseño de base de datos

### 11.1 Nombre

```text
indufor_db
```

### 11.2 Convenciones

- nombres de tablas y columnas en `snake_case`;
- PK numéricas `UNSIGNED`;
- transacciones de alto volumen: `BIGINT UNSIGNED`;
- catálogos/maestros pequeños: `INT UNSIGNED`;
- `created_at` y `updated_at` en tablas de implementación aunque el DER académico no los muestre;
- `deleted_at` solamente cuando exista justificación funcional;
- FKs indexadas;
- índices compuestos basados en consultas reales;
- dinero con `DECIMAL`, nunca `FLOAT`;
- zona horaria configurada a nivel de aplicación;
- enums de negocio preferentemente implementados como Value Objects/constantes y constraints, evitando valores libres;
- se preserva la 3FN del núcleo.

### 11.3 Nota de implementación respecto del DER académico

El esquema de las secciones 12–14 es una **propuesta de implementación**, no una transcripción íntegra ni un diseño físico ya aprobado. El PDF documenta 12 relaciones de dominio; las tablas RBAC, de integración y auditoría son extensiones técnicas de este proyecto. Las decisiones pendientes de `docs/discrepancias.md` deben resolverse antes de aprobar las migraciones afectadas.

Por la consigna de la cátedra (`Context.md` §24), toda extensión que llegue a migraciones debe incorporarse al DER, al modelo relacional, a la normalización y al diccionario del PDF. Una tabla implementada que no figura en el DER es motivo de inconsistencia entre diseño e implementación.

El DER del trabajo práctico utiliza `usuario.rol` como atributo.

Para la aplicación real, el rol se normaliza en tablas RBAC (`rol`, `permiso`, `usuario_rol`, `rol_permiso`) para evitar permisos codificados y permitir evolución. Esta modificación no cambia el requerimiento funcional; es una mejora física de implementación.

El **Sistema de Control de Gastos e Insumos** sigue siendo externo. Las tablas de integración locales almacenan intercambios, lotes y datos importados, pero **no representan internamente al sistema externo**.

---

## 12. Esquema físico propuesto de `indufor_db`

### 12.1 `frente_trabajo`

| Campo | Tipo | Regla |
|---|---|---|
| `id_frente` | INT UNSIGNED AI | PK |
| `nombre_frente` | VARCHAR(100) | NOT NULL, UNIQUE |
| `ubicacion_geografica` | VARCHAR(150) | NULL |
| `modalidad_produccion` | VARCHAR(20) | NOT NULL, `CONSOLIDADA` / `INDIVIDUAL` (D04) |
| `estado_activo` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Seed inicial: Papel Misionero y Bosques del Plata (`CONSOLIDADA`), Prusia (`INDIVIDUAL`).

### 12.2 `rol`

| Campo | Tipo | Regla |
|---|---|---|
| `id_rol` | INT UNSIGNED AI | PK |
| `codigo` | VARCHAR(40) | UNIQUE |
| `nombre` | VARCHAR(80) | NOT NULL |
| `descripcion` | VARCHAR(255) | NULL |
| `estado_activo` | BOOLEAN | DEFAULT TRUE |

Seeds: administración, gerencia, encargado, operario, camionero, logística, mantenimiento.

### 12.3 `permiso`

| Campo | Tipo | Regla |
|---|---|---|
| `id_permiso` | INT UNSIGNED AI | PK |
| `codigo` | VARCHAR(100) | UNIQUE |
| `descripcion` | VARCHAR(255) | NULL |

### 12.4 `rol_permiso`

| Campo | Tipo | Regla |
|---|---|---|
| `id_rol` | INT UNSIGNED | PK compuesta, FK → `rol.id_rol` |
| `id_permiso` | INT UNSIGNED | PK compuesta, FK → `permiso.id_permiso` |

### 12.5 `usuario`

| Campo | Tipo | Regla |
|---|---|---|
| `id_usuario` | INT UNSIGNED AI | PK |
| `nombre` | VARCHAR(80) | NOT NULL |
| `apellido` | VARCHAR(80) | NOT NULL |
| `email` | VARCHAR(190) | NOT NULL, UNIQUE |
| `password` | VARCHAR(255) | NOT NULL |
| `telefono_whatsapp` | VARCHAR(30) | NULL |
| `estado_activo` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `ultimo_acceso_at` | DATETIME | NULL |
| `remember_token` | VARCHAR(100) | NULL |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 12.6 `usuario_rol`

| Campo | Tipo | Regla |
|---|---|---|
| `id_usuario` | INT UNSIGNED | PK compuesta, FK → `usuario.id_usuario` |
| `id_rol` | INT UNSIGNED | PK compuesta, FK → `rol.id_rol` |
| `created_at` | TIMESTAMP | |

### 12.7 `frente_asignado`

Resuelve la relación M:N entre usuario y frente y conserva historial.

| Campo | Tipo | Regla |
|---|---|---|
| `id_asignacion` | INT UNSIGNED AI | PK |
| `id_frente` | INT UNSIGNED | FK → `frente_trabajo.id_frente` |
| `id_usuario` | INT UNSIGNED | FK → `usuario.id_usuario` |
| `fecha_desde` | DATE | NOT NULL |
| `fecha_hasta` | DATE | NULL |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Constraint de negocio: `fecha_hasta >= fecha_desde` cuando exista.

### 12.8 `tipo_maquinaria`

| Campo | Tipo | Regla |
|---|---|---|
| `id_tipo_maquinaria` | INT UNSIGNED AI | PK |
| `nombre` | VARCHAR(80) | UNIQUE |
| `metrica` | VARCHAR(20) | NOT NULL, `HOROMETRO` / `KILOMETRAJE` (D08) |
| `estado_activo` | BOOLEAN | DEFAULT TRUE |

### 12.9 `maquinaria`

| Campo | Tipo | Regla |
|---|---|---|
| `id_unidad` | INT UNSIGNED AI | PK |
| `nombre` | VARCHAR(100) | NOT NULL |
| `dominio_patente` | VARCHAR(20) | NULL, UNIQUE cuando aplique |
| `marca_modelo` | VARCHAR(120) | NOT NULL |
| `id_frente_actual` | INT UNSIGNED | NULL, FK → `frente_trabajo.id_frente` |
| `id_tipo_maquinaria` | INT UNSIGNED | FK → `tipo_maquinaria.id_tipo_maquinaria` |
| `id_usuario` | INT UNSIGNED | NULL, FK → `usuario.id_usuario` |
| `estado_activo` | BOOLEAN | DEFAULT TRUE |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 12.10 `tipo_madera`

| Campo | Tipo | Regla |
|---|---|---|
| `id_tipo_madera` | INT UNSIGNED AI | PK |
| `nombre` | VARCHAR(60) | UNIQUE |
| `estado_activo` | BOOLEAN | DEFAULT TRUE |

Seeds obligatorios:

- `pulpable`
- `aserrable`

### 12.11 `produccion`

| Campo | Tipo | Regla |
|---|---|---|
| `id_produccion` | BIGINT UNSIGNED AI | PK |
| `id_unidad` | INT UNSIGNED | FK → `maquinaria.id_unidad` |
| `id_usuario` | INT UNSIGNED | FK → `usuario.id_usuario` (quien registra) |
| `id_operario` | INT UNSIGNED | NULL, FK → `usuario.id_usuario` (operario productor, D04) |
| `id_frente` | INT UNSIGNED | FK → `frente_trabajo.id_frente` |
| `tipo_madera` | INT UNSIGNED | FK → `tipo_madera.id_tipo_madera` |
| `fecha_registro` | DATE | NOT NULL |
| `cantidad_toneladas` | DECIMAL(10,2) | NULL, >= 0 |
| `metros_cubicos` | DECIMAL(10,2) | NULL, >= 0 |
| `foto_soporte` | VARCHAR(255) | NULL |
| `observaciones` | TEXT | NULL |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Reglas:

- al menos una magnitud válida debe existir según el proceso;
- no aceptar valores negativos;
- frente, usuario y unidad deben ser coherentes con asignaciones activas;
- `tipo_madera` solo puede ser un catálogo habilitado.

Precisiones del diccionario y la Figura 9:

- `fecha_registro` corresponde a la jornada del parte; no debe confundirse con `created_at`.
- `id_usuario` identifica a quien registra o informa la producción según el diccionario. No demuestra por sí solo quién fue el operario productor cuando carga un encargado.
- La secuencia diferencia `tipoRegistro` consolidado/individual, pero el DER no incluye ese atributo. Su persistencia, el detalle por operario/máquina y la prevención de doble cómputo requieren decisión documentada antes de Fase 2.
- No sumar toneladas con metros cúbicos ni convertirlos mediante factores supuestos. La sección 1.4 también menciona unidades de carga, sin representación en el diccionario; resolver su alcance antes de añadir campos.
- La coherencia histórica de asignaciones debe evaluarse para la fecha del parte. El frente actual de la máquina no acredita su ubicación histórica; la política para cargas atrasadas requiere definición.

### 12.12 `viaje_logistica`

| Campo | Tipo | Regla |
|---|---|---|
| `id_viaje` | BIGINT UNSIGNED AI | PK |
| `id_unidad_camion` | INT UNSIGNED | FK → `maquinaria.id_unidad` |
| `id_usuario_camionero` | INT UNSIGNED | FK → `usuario.id_usuario` |
| `id_frente_origen` | INT UNSIGNED | FK → `frente_trabajo.id_frente` |
| `fecha` | DATETIME | NOT NULL |
| `destino` | VARCHAR(150) | NOT NULL |
| `tipo_madera` | INT UNSIGNED | FK → `tipo_madera.id_tipo_madera` |
| `volumen_declarado` | DECIMAL(10,2) | NOT NULL, > 0 |
| `observaciones` | TEXT | NULL |
| `estado_validacion` | VARCHAR(30) | NOT NULL |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Estados iniciales:

- `PENDIENTE`
- `VALIDADO`
- `CORRECCION_SOLICITADA`

No permitir transición directa a `VALIDADO` sin remito y cotejo.

### 12.13 `remito`

| Campo | Tipo | Regla |
|---|---|---|
| `numero_remito` | VARCHAR(50) | PK |
| `id_viaje` | BIGINT UNSIGNED | NOT NULL, UNIQUE, FK → `viaje_logistica.id_viaje` |
| `fecha_remito` | DATE | NOT NULL |
| `id_transportista` | INT UNSIGNED | NOT NULL, FK → `usuario.id_usuario` (transportista según el remito, D05) |
| `tipo_madera_remito` | INT UNSIGNED | FK → `tipo_madera.id_tipo_madera` |
| `volumen_toneladas_remito` | DECIMAL(10,2) | NOT NULL, > 0 |
| `fecha_recepcion_admin` | DATETIME | NOT NULL |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

En la primera versión, un remito pertenece a un viaje según el DER. Si el proceso real exige otra cardinalidad, debe resolverse mediante ADR antes de cambiar el esquema.

La Figura 12 muestra cardinalidad 1:1 entre viaje y remito. La unicidad de `remito.id_viaje` preserva esa relación; un viaje recién declarado puede no tener todavía remito, conforme a la Figura 10. `numero_remito` se conserva como PK del modelo fuente; si la numeración real se repite por emisor/serie, el cambio de identidad requiere ADR.

Decisiones D05 y D06: `id_transportista` es el dato documental del remito y ambos volúmenes se expresan en toneladas. Antecedente: el diccionario original no incluía el ID de transportista del remito exigido por RF08. No reutilizar el camionero del viaje como supuesto dato documental: hacerlo impediría detectar una discrepancia. La representación del dato independiente debe definirse antes de Fase 3. Tampoco está definida inequívocamente la unidad de `volumen_declarado` ni la de `volumen_toneladas_remito`; el diccionario describe este último como volumen o peso. El cotejo exacto exige resolver unidades y precisión, sin asumir conversiones ni tolerancias.

### 12.14 `solicitud_correccion`

| Campo | Tipo | Regla |
|---|---|---|
| `id_solicitud` | BIGINT UNSIGNED AI | PK |
| `id_viaje` | BIGINT UNSIGNED | FK → `viaje_logistica.id_viaje` |
| `fecha_solicitud` | DATETIME | NOT NULL |
| `detalle_diferencias` | TEXT | NOT NULL |
| `estado` | VARCHAR(30) | NOT NULL |
| `fecha_resolucion` | DATETIME | NULL |
| `id_usuario_responsable` | INT UNSIGNED | NULL, FK → `usuario.id_usuario` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Estados sugeridos:

- `PENDIENTE`
- `EN_REVISION`
- `RESUELTA`

Un viaje puede tener varias solicitudes.

### 12.15 `lectura_mantenimiento`

| Campo | Tipo | Regla |
|---|---|---|
| `id_lectura` | BIGINT UNSIGNED AI | PK |
| `id_unidad` | INT UNSIGNED | FK → `maquinaria.id_unidad` |
| `id_operario_reporte` | INT UNSIGNED | FK → `usuario.id_usuario` |
| `fecha_lectura` | DATETIME | NOT NULL |
| `horometro_actual` | DECIMAL(12,2) | NULL |
| `kilometraje_actual` | INT UNSIGNED | NULL |
| `tiene_falla` | BOOLEAN | NOT NULL DEFAULT FALSE |
| `detalle_falla` | TEXT | NULL |
| `falla_atendida_at` | DATETIME | NULL; cuándo Mantenimiento atendió la falla (D20) |
| `id_usuario_atencion` | INT UNSIGNED | NULL, FK → `usuario.id_usuario` (quién la atendió, D20) |
| `nota_atencion` | TEXT | NULL; qué se hizo (D20) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Reglas críticas:

- no admitir lectura inferior a la lectura anterior de la misma unidad;
- la unidad determina qué métrica corresponde;
- si `tiene_falla = true`, `detalle_falla` es obligatorio;
- una lectura inválida no puede exportarse al sistema externo.

La Figura 11 define validación lógica contra la última lectura, persistencia de la lectura válida y exportación posterior automática. La presencia de una falla genera además una novedad y notificación a Mantenimiento; no invalida automáticamente el valor ni exige aprobación humana según ese flujo. El esquema no incluye estado/actor de aprobación: no agregar un circuito manual sin requerimiento aprobado. Definir en ADR cómo se evidencia la validación y cómo se registra el resultado de la exportación.

Quedan pendientes la primera lectura sin antecedente, la configuración de métrica por unidad, la concurrencia de cargas, las lecturas atrasadas y los cambios/reemplazos de instrumentos. Estas decisiones deben preservar RNF05 y no habilitar excepciones silenciosas a la regla de no regresión.

### 12.16 `control_matafuego`

| Campo | Tipo | Regla |
|---|---|---|
| `id_control` | BIGINT UNSIGNED AI | PK |
| `id_unidad` | INT UNSIGNED | FK → `maquinaria.id_unidad` |
| `id_operario` | INT UNSIGNED | FK → `usuario.id_usuario` |
| `estado_matafuego` | VARCHAR(40) | NOT NULL, `OK` / `DESCARGADO` / `DANADO` / `FALTANTE` (D20) |
| `fecha_revision` | DATE | NOT NULL |
| `fecha_vencimiento_carga` | DATE | NOT NULL |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

## 13. Tablas técnicas de integración

Estas tablas son de implementación. No transforman al Sistema de Control de Gastos e Insumos en un subsistema interno.

### 13.1 `integracion_lote`

| Campo | Tipo | Regla |
|---|---|---|
| `id_lote` | BIGINT UNSIGNED AI | PK |
| `tipo` | VARCHAR(40) | `EXPORT_LECTURAS` / `IMPORT_CONSUMOS` |
| `periodo` | CHAR(7) | formato `YYYY-MM` cuando aplique |
| `nombre_archivo` | VARCHAR(255) | NULL |
| `checksum` | VARCHAR(128) | NULL |
| `estado` | VARCHAR(30) | NOT NULL; importación: `OK` / `PARCIAL` / `ERROR` / `REEMPLAZADO` / `RECHAZADO` (D21, ADR-004); exportación: `EN_PROCESO` / `OK` / `ERROR` |
| `id_usuario` | INT UNSIGNED | NULL, FK → `usuario.id_usuario` |
| `iniciado_at` | DATETIME | NOT NULL |
| `finalizado_at` | DATETIME | NULL |
| `detalle_error` | TEXT | NULL |

Debe utilizarse checksum/idempotency key para evitar importar dos veces el mismo lote.

El checksum por sí solo no evita duplicados semánticos entre archivos distintos ni define cómo reemplazar un consolidado corregido. El contrato de integración debe establecer identidad externa, unidad de intercambio, correcciones del mismo período, confirmaciones, reintentos y tratamiento de fallas parciales. RF12 exige exportación automática; las acciones manuales de soporte no sustituyen esa automatización. El formato y transporte no están especificados en el PDF.

### 13.2 `consumo_importado`

Persistencia local de los datos que RF13 exige importar.

| Campo | Tipo | Regla |
|---|---|---|
| `id_consumo` | BIGINT UNSIGNED AI | PK |
| `id_lote` | BIGINT UNSIGNED | FK → `integracion_lote.id_lote` |
| `id_unidad` | INT UNSIGNED | FK → `maquinaria.id_unidad` |
| `periodo` | CHAR(7) | NOT NULL |
| `litros` | DECIMAL(12,2) | NOT NULL, >= 0 |
| `costo_total` | DECIMAL(14,2) | NOT NULL, >= 0 |
| `referencia_externa` | VARCHAR(120) | NULL |
| `created_at` | TIMESTAMP | |

Índice recomendado: `(periodo, id_unidad)`.


### 13.3 `idempotencia`

Tabla técnica de reintentos sin duplicados (D22, `specs/05-idempotencia.md`). Reemplaza la caché de 24 h.

| Campo | Tipo | Regla |
|---|---|---|
| `id_idempotencia` | BIGINT UNSIGNED AI | PK |
| `id_usuario` | INT UNSIGNED | FK → `usuario.id_usuario` |
| `operacion` | VARCHAR(20) | `parte` / `viaje` / `lectura` |
| `clave` | VARCHAR(64) | Idempotency-Key enviada por el cliente |
| `hash_contenido` | CHAR(64) | SHA-256 de los datos validados; otra carga con la misma clave → `409 CLAVE_REUTILIZADA` |
| `entidad_id` | BIGINT UNSIGNED | NULL hasta completar el alta, en la misma transacción |
| `created_at` | TIMESTAMP | |

Índice único `(id_usuario, operacion, clave)`: es lo que garantiza un solo registro por clave, aun con envíos simultáneos. Sin vencimiento (D22).

---

## 14. Auditoría

### `auditoria_evento`

| Campo | Tipo | Regla |
|---|---|---|
| `id_evento` | BIGINT UNSIGNED AI | PK |
| `id_usuario` | INT UNSIGNED | NULL, FK → `usuario.id_usuario` |
| `bounded_context` | VARCHAR(60) | NOT NULL |
| `accion` | VARCHAR(80) | NOT NULL |
| `entidad` | VARCHAR(100) | NOT NULL |
| `entidad_id` | VARCHAR(100) | NULL |
| `before_json` | JSON | NULL |
| `after_json` | JSON | NULL |
| `correlation_id` | VARCHAR(100) | NULL |
| `ip` | VARCHAR(45) | NULL |
| `user_agent` | VARCHAR(255) | NULL |
| `created_at` | TIMESTAMP | NOT NULL |

Auditar como mínimo:

- altas/bajas lógicas y cambios de permisos;
- asignaciones a frentes;
- correcciones de producción;
- validación/rechazo de viajes;
- cambios sobre remitos;
- solicitudes de corrección;
- lecturas de mantenimiento rechazadas/corregidas;
- importaciones/exportaciones;
- acceso a reportes financieros si la política de seguridad lo exige.

---

## 15. Índices y constraints iniciales

Índices mínimos a evaluar en migraciones:

```text
frente_asignado(id_usuario, fecha_desde, fecha_hasta)
frente_asignado(id_frente, fecha_desde, fecha_hasta)

maquinaria(id_frente_actual)
maquinaria(id_tipo_maquinaria)

produccion(fecha_registro, id_frente)
produccion(id_unidad, fecha_registro)
produccion(id_usuario, fecha_registro)
produccion(tipo_madera, fecha_registro)

viaje_logistica(fecha, id_frente_origen)
viaje_logistica(id_usuario_camionero, fecha)
viaje_logistica(estado_validacion, fecha)

remito(id_viaje)

solicitud_correccion(id_viaje, estado)

lectura_mantenimiento(id_unidad, fecha_lectura)

control_matafuego(id_unidad, fecha_revision)

consumo_importado(periodo, id_unidad)

auditoria_evento(entidad, entidad_id, created_at)
auditoria_evento(id_usuario, created_at)
```

Los índices finales deben justificarse a partir de queries reales y no agregarse indiscriminadamente.
