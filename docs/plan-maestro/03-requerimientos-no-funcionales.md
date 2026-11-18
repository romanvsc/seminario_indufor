# Requerimientos no funcionales oficiales

Tareas de verificación; no implican que el requisito esté pendiente de implementación ni que esté acreditado actualmente. La disponibilidad exige medición en un entorno desplegado.

## Tareas

### [HECHO] CAL-001 — RNF01: Usabilidad/HCI

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 9; docs/trazabilidad.md (RNF01)
- **Contexto propietario:** calidad transversal
- **Dependencias:** FAS-007
- **Alcance:** la captura móvil debe estar optimizada para personal de campo con controles simples, autocompletado y desplegables que reduzcan tecleo y errores.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** ver la fila de docs/trazabilidad.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RNF01
- **Criterios de aceptación:** RNF01 cumplido según su fila de docs/trazabilidad.md y con sus tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** docs/trazabilidad.md, fila RNF01 (2026-10-27). Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] CAL-002 — RNF02: Rendimiento/Inmediatez

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 9; docs/trazabilidad.md (RNF02)
- **Contexto propietario:** calidad transversal
- **Dependencias:** FAS-007
- **Alcance:** los datos de campo deben quedar disponibles para Administración de manera inmediata, con sincronización automática.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** ver la fila de docs/trazabilidad.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RNF02
- **Criterios de aceptación:** RNF02 cumplido según su fila de docs/trazabilidad.md y con sus tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** docs/trazabilidad.md, fila RNF02 (2026-10-27). Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] CAL-003 — RNF03: Seguridad/RBAC

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 9; docs/trazabilidad.md (RNF03)
- **Contexto propietario:** calidad transversal
- **Dependencias:** FAS-007
- **Alcance:** autenticación y permisos por roles; información financiera/configuración crítica restringida a Gerencia y Administración.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** ver la fila de docs/trazabilidad.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RNF03
- **Criterios de aceptación:** RNF03 cumplido según su fila de docs/trazabilidad.md y con sus tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** docs/trazabilidad.md, fila RNF03 (2026-10-27). Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [PARCIAL] CAL-004 — RNF04: Disponibilidad

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 9; docs/trazabilidad.md (RNF04)
- **Contexto propietario:** calidad transversal
- **Dependencias:** DEP-001
- **Alcance:** uptime superior a **99,5 %** dentro de la ventana operativa de la empresa.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** ver la fila de docs/trazabilidad.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RNF04
- **Criterios de aceptación:** disponibilidad > 99,5 % medida en la ventana operativa del entorno desplegado
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** publicar (DEP-001) y medir el uptime con /up durante la ventana operativa
- **Evidencia actual:** Preparado: runbook, /up, backup y restore probados (ADR-005); HardeningTest en verde. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado. Falta el entorno desplegado para medir.

### [HECHO] CAL-005 — RNF05: Confiabilidad/Consistencia

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 9; docs/trazabilidad.md (RNF05)
- **Contexto propietario:** calidad transversal
- **Dependencias:** FAS-004
- **Alcance:** no permitir horómetros o kilometrajes inferiores a la lectura anterior de la misma unidad, **alertando en tiempo real** ante posibles números invertidos o entradas inconsistentes. Implica aviso inmediato en el formulario (cliente) además del rechazo autoritativo en el backend.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** ver la fila de docs/trazabilidad.md; RNF05: ninguna lectura menor a la anterior
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RNF05
- **Criterios de aceptación:** RNF05 cumplido según su fila de docs/trazabilidad.md y con sus tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** docs/trazabilidad.md, fila RNF05 (2026-10-27). Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.
