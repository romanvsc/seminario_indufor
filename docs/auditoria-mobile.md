# Auditoría mobile (UIX-022)

> Recorrido del 2026-11-11 en un celular de 360×740 px (Android de gama baja, como el del campo), emulado en Chromium con `isMobile` y pantalla táctil. Roles: Administración, Gerencia, encargado, operaria, camionero y Mantenimiento. Se recorrieron 48 pantallas en tema oscuro y las de campo también en claro.
> Reproducible con `e2e/fase7-mobile.spec.ts`. Con `RECORRIDO=<carpeta>` guarda capturas por tramo de pantalla.
> Limitación: es una emulación. No reemplaza una prueba en un equipo real con guantes, sol y 3G.

## Chequeos automáticos

| Chequeo | Resultado |
|---|---|
| Desborde horizontal o contenido recortado a la derecha | Ninguno |
| Texto de menos de 12 px | Ninguno |
| Objetivos táctiles de menos de 44 px (WCAG 2.5.5, regla 4 de la UX de campo) | 107 casos en 26 pantallas, casi todos de gestión |

## Hallazgos

Severidad: **alta** cuando impide o confunde una tarea; **media** cuando la entorpece o muestra un dato engañoso; **baja** cuando es pulido.

| ID | Pantalla y rol | Tipo | Sev. | Evidencia | Propuesta | Estado |
|---|---|---|---|---|---|---|
| MOB-01 | Reportes (Adm., Ger.) | Discrepancia | Alta | Las pestañas pasan a dos filas y la segunda (Consolidado mensual, Consumos, Operativo, Integración) queda debajo de los filtros. La pestaña activa no se ve. Causa: el trigger mide `calc(100%-1px)` dentro de una lista de alto automático. | Una sola fila de pestañas con scroll horizontal y alto propio de 44 px. | Hecho, con otra solución: debajo de `sm` las pestañas pasan a un select nativo de 44 px; desde `sm`, una fila con scroll horizontal |
| MOB-02 | Filtros y acciones de gestión (Producción, Viajes, Lecturas, Mantenimiento, Usuarios, Frentes, Maquinaria, Reportes) | Discrepancia | Alta | Campos y selects de 36 a 40 px de alto. Botones "Nuevo usuario", "Nuevo frente", "Nueva unidad", "Tipos", "Importar", "Descargar archivo de prueba", "Imprimir" y "Ver reportes" de 32 a 36 px. Acciones de fila (ver detalle, ver foto) de 36×36 y "Corregir" de 82×32. | 44 px de alto mínimo en el celular desde los componentes compartidos (`Input`, `Button`, `NativeSelect`, combobox de filtros). Escritorio sin cambios. | Hecho (fase7-mobile en verde) |
| MOB-03 | Inicio (Adm., Ger.) y Mantenimiento | Discrepancia | Media | Links de panel ("Histórico", "Detalle") de 20 px de alto. Links de unidad en tablas ("HV-E2E4", "CT-E2E5") de 18 px. | Área táctil de 44 px con padding, sin cambiar el tamaño visual. | Hecho (fase7-mobile en verde) |
| MOB-04 | Inicio (Adm., Ger.) | Mejora | Media | Los 4 KPI van en una columna, cada uno a lo ancho: ocupan más de una pantalla antes del gráfico. | Dos columnas en el celular. El minigráfico se oculta debajo de 640 px. | Hecho: dos columnas en el celular; las tarjetas ya no llevan minigráfico |
| MOB-05 | Inicio (todos) | Mejora | Media | "Imprimir" no sirve en el celular. La fecha y el estado de actualización ocupan dos líneas propias. | Ocultar "Imprimir" debajo de `md`. Fecha y estado en una sola línea compacta. | Hecho |
| MOB-06 | Inicio, Pendientes y alertas (todos) | Discrepancia | Media | El recorte a una línea, pensado para igualar las filas en escritorio, en el celular deja títulos ilegibles ("Falta importar el cons…"). | Recortar solo desde `lg`; en el celular el texto se ajusta a varias líneas. | Hecho |
| MOB-07 | Inicio, Carga por frente (Adm., Ger.) | Discrepancia | Media | Prusia muestra "0,00 t · 0 %" con una barra vacía, aunque produjo 12,00 m³: el frente parece inactivo. | Si un frente solo tiene m³, mostrar los m³ como dato principal, sin barra ni porcentaje de toneladas. | Hecho |
| MOB-08 | Formularios de campo (parte, lectura, matafuego, viaje) | Discrepancia | Media | "En línea" aparece dos veces: en la barra superior y debajo del título. | Dejar solo el de la barra superior en el celular; en escritorio queda el de la página. | Hecho |
| MOB-09 | Formularios de campo | Discrepancia | Media | "○ Borrador guardado en este equipo, todavía sin enviar" aparece al abrir el formulario vacío, sin que se haya escrito nada. Informa un estado que no existe. | Mostrarlo solo si hay un borrador guardado. | Hecho |
| MOB-10 | Parte de producción (foto) y Reportes → Integración (CSV) | Mejora | Media | Control de archivo nativo: chico y con textos del navegador ("Choose File", "No file chosen"). | Botón propio de 44 px ("Sacar o elegir foto", "Elegir archivo CSV") y el nombre del archivo elegido en español. | Hecho (`SelectorArchivo`; el área táctil cubre el borde desde el 2026-11-13) |
| MOB-11 | Producción (listado apilado) | Discrepancia | Baja | Las etiquetas "Toneladas" y "m³" salen en monoespaciada negrita; las demás etiquetas de la tarjeta, en la tipografía normal. | Misma tipografía para todas las etiquetas de la tabla apilada. | Hecho |
| MOB-12 | Reportes → Integración, historial | Discrepancia | Baja | Fechas en formato ISO ("2026-11-11 19:44") y "1 unidades". | Fecha local (dd/mm/aaaa hh:mm) y plural correcto. | Hecho |
| MOB-13 | Panel técnico, estado de la flota (Adm., Mant.) | Discrepancia | Baja | "Sin lectura desde el lunes" y "Sin controles" en rojo. Son pendientes, no errores (regla UIX-017: rojo para error, ámbar para alerta). | Ámbar. Rojo solo para vencido o falla. | Hecho |
| MOB-14 | Listados de gestión | Mejora | Baja | El bloque de filtros ocupa casi toda la primera pantalla; los resultados empiezan abajo. | Filtros plegables en el celular, con la cantidad de filtros activos. | Hecho, sin contador: los filtros activos siguen visibles como etiquetas con el panel plegado |
| MOB-15 | Menú lateral (Adm., Ger.) | Mejora | Baja | A 740 px de alto, la sección Gestión queda debajo del pliegue y nada indica que hay más opciones. | Sombra o desvanecido al pie de la lista cuando hay más contenido. | Hecho |
| MOB-16 | Formularios de campo | A verificar | — | En capturas scrolleadas se ve el título de la página "fantasma" detrás de los campos. Puede ser un artefacto de la captura (fondo `sticky`). | Verificar en un navegador real antes de corregir. | Descartado: artefacto de captura con renderizador por software. Con GPU real (2026-11-13), el fondo es continuo y no hay título detrás |

Los checkboxes y radios de 16 a 20 px no se cuentan como hallazgo: la etiqueta que los rodea es el área táctil y supera los 44 px de alto. En el login, la etiqueta de "Mantener la sesión iniciada" se agranda dentro de MOB-02.

## Lo que ya funciona bien

- No hay ninguna pantalla con scroll horizontal. Las tablas se apilan como tarjetas (`tabla-apilada`).
- Formularios de campo: una columna, botón principal fijo abajo, campos de 48 px, estado de conexión visible y texto de 16 px.
- Los estados usan ícono y texto además del color (✓ Validado, ⚠ Sin lectura).
- Menú lateral con ítems de 44 px y el usuario y "Salir" siempre visibles.
