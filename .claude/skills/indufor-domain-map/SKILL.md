---
name: indufor-domain-map
description: Mapa del dominio INDUFOR - lenguaje ubicuo, actores, roles RBAC, bounded contexts, dueño de cada tabla y dependencias permitidas entre contextos. Úsala SIEMPRE antes de crear o mover una entidad, tabla, endpoint, permiso, carpeta de feature o caso de uso; cuando haya que decidir a qué contexto pertenece algo; al tocar roles/permisos o la matriz rol→permiso; y cuando aparezca un concepto de negocio nuevo (combustible, novedades, Corrientes, validación de producción) que no esté en los RF. También aplica a preguntas tipo "¿dónde va esto?", "¿quién puede hacer X?" o "¿qué significa remito/cotejo/frente?".
---

# Mapa del dominio INDUFOR

Esta skill evita dos errores caros: mezclar responsabilidades entre contextos y meter reglas de negocio que nadie aprobó. La cátedra evalúa la coherencia **sistema actual → problemas → requerimientos → diseño → sistema**, así que todo concepto del código debe poder rastrearse hasta un RF del PDF.

Fuentes: `Context.md` §1, §6.1, §8–§10, §16 · `docs/database.md` · `docs/discrepancias.md`.

## Lenguaje ubicuo

Usar estos términos en código, UI, tests y commits (en español para el dominio; inglés solo para piezas técnicas del framework).

| Término | Significado | No confundir con |
|---|---|---|
| Frente de trabajo / unidad de negocio | Papel Misionero, Bosques del Plata, Prusia | "Unidad" como máquina |
| Unidad (`maquinaria`) | Máquina forestal, camión, camioneta o vehículo liviano | Frente |
| Parte de producción | Registro diario de producción de una jornada (`produccion`) | `created_at` |
| Pulpable / aserrable | Únicos tipos de madera habilitados; nunca se suman entre sí | — |
| Carga consolidada | Encargado reporta la producción del grupo (Papel Misionero, Bosques) | Carga individual (Prusia) |
| Viaje / declaración | Lo que el camionero declara digitalmente (`viaje_logistica`) | Remito |
| Remito | Documento comercial físico; Administración carga sus datos | Viaje |
| Cotejo | Comparación exacta viaje ↔ remito que decide `VALIDADO` o corrección | Aprobación manual |
| Solicitud de corrección | Registro de incongruencia del cotejo (RF08); un viaje puede tener varias | Edición del viaje |
| Lectura | Horómetro (máquinas forestales) o kilometraje (livianos/camionetas), corte lunes | — |
| Falla / novedad de mantenimiento | Falla instrumental o mecánica informada en la lectura | Novedad de personal (sin RF) |
| Quincena | Cierre de producción (límites exactos: D10) | Mes |
| Período vencido | Mes anterior; su consolidado de gastos debe estar antes del día 15 | — |
| Sistema de Control de Gastos e Insumos | Terminador externo; nunca una tabla interna | — |

## Actores → roles técnicos

`administracion`, `gerencia`, `encargado`, `operario`, `camionero`, `logistica`, `mantenimiento` (códigos sin tilde; el nombre visible lleva tilde). El nombre de una persona (por ejemplo, el gerente o el jefe de mantenimiento) nunca reemplaza al rol. El catálogo de permisos está en `Context.md` §10.

Puntos que suelen malinterpretarse:
- Administración ve todos los frentes, pero eso no le da permisos técnicos irrestrictos.
- Gerencia consulta; no edita datos operativos.
- Logística apoya el cotejo; la validación es de Administración (RF06).
- Solo Administración y Gerencia ven reportes financieros o tocan configuración crítica (RNF03).
- No existe `production.validate` (D16).

## Bounded contexts y dueño de cada tabla

| Contexto | Tablas propias | Puede leer de |
|---|---|---|
| Identity & Access | `usuario`, `rol`, `permiso`, `usuario_rol`, `rol_permiso` | — |
| Frentes & Assignments | `frente_trabajo`, `frente_asignado` | Identity |
| Fleet & Machinery | `maquinaria`, `tipo_maquinaria` | Frentes, Identity |
| Production | `produccion`, `tipo_madera` (catálogo compartido de solo lectura para otros) | Frentes (asignación vigente a la fecha), Fleet, Identity |
| Logistics | `viaje_logistica`, `remito`, `solicitud_correccion` | Fleet, Frentes, Identity, catálogo `tipo_madera` |
| Maintenance | `lectura_mantenimiento`, `control_matafuego` | Fleet, Identity |
| External Costs Integration (ACL) | `integracion_lote`, `consumo_importado` | Fleet (mapeo de unidades) |
| Reporting & Management | Sin tablas propias de escritura; consultas de lectura | Todos, vía consultas autorizadas |
| Audit & Traceability | `auditoria_evento` | Recibe eventos de todos |

Reglas:
- Un contexto no escribe en tablas de otro ni ejecuta reglas de otro leyendo sus tablas directamente; usa un caso de uso, puerto o consulta autorizada.
- Maintenance exporta lecturas a través del puerto de External Costs Integration; nunca conoce el formato externo.
- Reporting solo lee y respeta RBAC al filtrar.

## Cuando aparece un concepto nuevo

Si una tarea necesita algo que no está en RF01–RF16 (por ejemplo, stock de tanques, novedades de personal, Corrientes, estado de aprobación de producción):

1. Buscarlo en `docs/discrepancias.md`. Si existe, respetar su estado (pendiente = no implementar).
2. Si no existe, agregar una fila nueva con evidencia (página del PDF) y la decisión requerida.
3. Avisar al usuario. Implementarlo exige primero el requerimiento aprobado, luego el ADR, y el reflejo en el DER del PDF (`docs/cambios-pdf.md`).

La razón: la cátedra desaprueba por inconsistencia entre análisis e implementación, y un módulo sin RF es exactamente eso.
