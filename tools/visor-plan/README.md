# Visor del plan maestro

Herramienta local React/TypeScript independiente de la PWA. Las fuentes son Markdown en `docs/plan-maestro`; el parser del kit valida y publica el mismo grafo. El visor no modifica el plan.

Desde la raíz del repositorio, en dos terminales:

```powershell
python -B .agents/skills/manage-project-roadmap/scripts/roadmap.py check
python -B .agents/skills/manage-project-roadmap/scripts/roadmap.py serve --port 18788 --output "$env:TEMP/indufor-plan-visor.html"
```

```powershell
npm --prefix tools/visor-plan ci
npm --prefix tools/visor-plan run dev
```

Abrir `http://127.0.0.1:8788`. El proxy Vite reenvía `/__roadmap__` al servidor del kit en loopback. Al cambiar el plan, el servidor comprueba el esquema; si no es válido, el visor muestra el error y conserva la Última revisión válida durante la sesión. Si el servidor no arranca por un plan inicialmente inválido, corregirlo con `check` antes de abrir el visor. El HTML que genera internamente el servidor se guarda en el directorio temporal y no es el visor React.

Para producción local del bundle: `npm --prefix tools/visor-plan run build`. El servidor Python es necesario para datos y actualización; el bundle por sí solo no exporta un visor autónomo. La validación estructural no prueba el funcionamiento del producto.


## Verificación de integración (2026-11-04)

El plan validó con 15 tareas de revisión; el build React pasó y se comprobaron el servidor, proxy y controles principales con Chromium automatizado. El puerto 8788 estaba ocupado y se usó 18788. La suite original del kit no terminó: la prueba de puerto ocupado quedó esperando en Windows. En pruebas separadas del instalador y parser, 19 de 21 pasaron; las dos restantes requieren privilegios de creación de enlaces simbólicos (WinError 1314). El comportamiento del servidor con puertos ocupados en Windows necesita revisión adicional.
