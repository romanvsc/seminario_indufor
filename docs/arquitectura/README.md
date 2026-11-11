# Arquitectura existente

INDUFOR declara arquitectura hexagonal con contextos de negocio, API Laravel/Sanctum y SPA React separada. El sistema externo se integra mediante una capa anticorrupción. El detalle y las reglas vigentes están en [Context.md](../../Context.md), [CLAUDE.md](../../CLAUDE.md), [fases](../fases.md), [trazabilidad](../trazabilidad.md) y los [ADR](../adr/).

La skill del kit orienta cambios nuevos; su instalación no acredita que todo el código existente cumpla cada principio ni autoriza una migración. El visor del plan es una herramienta de desarrollo independiente y no participa del dominio ni de la PWA.
