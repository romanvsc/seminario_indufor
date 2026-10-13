---
name: indufor-field-mobile-ux
description: UX de captura en campo para INDUFOR (RNF01, RNF02) - formularios móviles para encargados, operarios, maquinistas y camioneros con poca capacitación tecnológica y señal inestable en el monte; mínima escritura, selects y autocompletado, teclado numérico, estados pendiente/sincronizando/sincronizado/error, borradores que no se pierden y nunca "guardado" sin confirmación del backend. Úsala siempre que se diseñe, programe o revise una pantalla de carga de producción, viaje, lectura de horómetro/kilometraje o matafuego, o cualquier pantalla que use personal de campo desde el celular, aunque solo se pida "un formulario simple".
---

# UX de campo (RNF01, RNF02)

Quien carga es un operario con guantes, sol en la pantalla y una barra de señal, que hoy manda una foto por WhatsApp porque es lo más fácil. Si el formulario es más difícil que la foto, no se va a usar, y si pierde datos sin avisar, se pierde la confianza para siempre. Cada decisión de diseño se mide contra eso.

Fuentes: `Context.md` §3 (PWA, React Bits), §9, §18 · skill `indufor-react-frontend` para la implementación.

## Pantallas de campo

| Pantalla | Usuario | Contexto |
|---|---|---|
| Parte de producción consolidado | Encargado (Papel Misionero, Bosques) | Production |
| Parte de producción individual | Operario (Prusia) | Production |
| Declaración de viaje | Camionero | Logistics |
| Lectura semanal + falla | Encargado / operario | Maintenance |
| Control mensual de matafuego | Encargado / operario | Maintenance |

## Reglas de diseño

1. **Mobile-first**, una columna, una tarea por pantalla. Acción principal abajo, al alcance del pulgar.
2. **Mínima escritura:** selects y combobox para frente, unidad, tipo de madera y destino. Precargar lo que se puede inferir (frente de la asignación vigente, fecha de hoy, la unidad habitual del usuario), siempre editable.
3. **Teclado correcto:** `inputmode="decimal"` para toneladas, m³ y volumen; `inputmode="numeric"` para kilometraje.
4. **Objetivos táctiles de 44×44 px o más**, contraste alto y texto ≥ 16 px (también evita el zoom automático en iOS).
5. **Validación inmediata pero no agresiva:** validar al salir del campo, no en cada tecla. Mensajes que digan qué hacer ("La lectura anterior fue 12.430 h; revisá si los números están invertidos").
6. **Estados de envío visibles y distintos**, con texto e ícono, no solo color: *pendiente*, *sincronizando*, *sincronizado*, *error*.
7. **Nunca mostrar "guardado" sin confirmación del backend.** Lo que se guardó solo localmente se muestra como pendiente.
8. **Borradores:** si falla la red o se cierra la app, el formulario se recupera. Los datos sensibles en el cliente se limpian al cerrar sesión.
9. **Reintentos sin duplicados:** cada envío lleva una clave de idempotencia.
10. **Indicador online/offline** siempre visible en las pantallas de campo.
11. **Sin animaciones pesadas.** React Bits está prohibido en estas pantallas (peso, batería, señal). Transiciones mínimas que respeten `prefers-reduced-motion`.
12. **Accesibilidad WCAG básica:** labels reales, foco visible, errores anunciados (`aria-live`).

## Captura sin conexión

Ser PWA no significa que toda escritura funcione offline. Qué operaciones admiten captura diferida se decide por ADR, por contexto, antes de implementarse. Mientras no exista ese ADR: guardar el borrador localmente y exigir conexión para confirmar.

## Revisión de una pantalla de campo

Antes de dar por terminada una pantalla, comprobar:
- [ ] ¿Se completa con una mano y escribiendo solo números?
- [ ] ¿Qué pasa si la red se corta justo al tocar "Enviar"?
- [ ] ¿Se distingue *pendiente* de *sincronizado* sin depender del color?
- [ ] ¿Se recupera el borrador al reabrir?
- [ ] ¿El mensaje de error dice qué hacer?
- [ ] ¿Funciona en un celular de gama baja con 3G lento (Playwright con throttling)?
