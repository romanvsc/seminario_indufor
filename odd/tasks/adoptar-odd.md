# Adoptar ODD en INDUFOR

**Plan maestro:** MET-001 (estado oficial en el plan).

## Objetivo y criterios

- Aplicar ODD a Claude y Codex conservando arquitectura, decisiones y registro de todas las tareas en el plan maestro.
- Mantener SDD y sus especificaciones como antecedentes históricos, sin instrucciones activas contradictorias.
- Instalar Engram oficial y comprobar que ambos clientes puedan recuperar memoria del mismo proyecto.

## Tareas

- [x] Relevar instrucciones y estado local.
- [x] Redactar el flujo ODD y aclarar el carácter histórico de SDD.
- [x] Instalar y configurar Engram para Claude y Codex.
- [x] Validar plan, cambios y límites de la verificación.
- [ ] Comprobar lectura y escritura compartidas desde nuevas sesiones de ambos agentes.

## Registro

- 2026-11-04: plan aprobado; el repositorio contiene cambios locales previos que deben conservarse. Engram no aparece en PATH ni en la configuración MCP de Codex.
- 2026-11-04: Engram 3.6.2 y jq 1.8.2 instalados desde releases oficiales con SHA-256 validado. Setup de ambos agentes completado; Claude muestra Connected, Codex muestra MCP habilitado, el servidor MCP detecta `seminario_indufor` y doctor informa 10/10 comprobaciones correctas. Plan validado con 48 tareas y diff sin errores; falta comprobar la memoria desde ambas sesiones tras reiniciar. El contrato vigente está en `ODD.md`; SDD se conserva como antecedente.
