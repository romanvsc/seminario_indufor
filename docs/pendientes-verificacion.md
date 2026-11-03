# Pendientes de verificación — sidebar, tema oscuro e inicio (2026-11-03)

> Rama: `mejoras/auditoria`. Commits: sidebar, tema oscuro e inicio "Centro de operaciones".
> Se commitearon **sin la verificación completa**, a pedido del usuario. Este documento dice qué falta y deja un prompt listo para cada punto.

## Estado: puntos 1 y 2 resueltos (2026-11-03, MariaDB 10.4 de XAMPP estable, PHP 8.4)

- **Punto 1:** los tests nuevos (Pendientes, Actividad, DemoSeeder) pasaron 9/9 sin cambios. Pest completo 184/184, Pint sin observaciones.
- **Punto 2:** `fase1` «tipo de maquinaria y unidad» pasó con la base estable; el fallo anterior era la base, no la sidebar ni el tema. Suite E2E 45/45, offline 2/2. axe marcó un problema de contraste en el tema oscuro: botones y badges destructivos con `text-white` sobre `#F87171` (2,8:1). Se corrigió con el token `destructive-foreground` (6,85:1), commit `a9c698a`. Vitest 87/87, typecheck, lint y build en verde.
- **Revisión con DemoSeeder:** Ana ve el centro de operaciones (5 pendientes); Elena, Carla y Marta ven solo lo suyo. Al atender la falla de SK-BP1, el inicio pasó de 1 a 0 fallas sin recargar. Sin señal muestra "Mostrando datos de las HH:MM · sin conexión".

## Qué está verificado (al commitear, antes de la caída)

- Frontend: Vitest 87/87, `typecheck`, `lint` y `build` sin errores.
- Capturas en Chromium con la API simulada: inicio de Administración y de campo, en escritorio y celular, formularios y login en tema oscuro.
- La transición de la sidebar (0,5 s) se midió en el navegador.
- Backend: `php -l` y Pint sin observaciones.

## Por qué no se pudo terminar

El MySQL (MariaDB 10.4) de XAMPP de la computadora de desarrollo se cayó dos veces el 2026-11-03:

1. Después de un apagado abrupto del equipo, la recuperación de InnoDB dejó trabadas las tablas `sessions` y `cache` de `indufor_db`. Las consultas quedaban en "Opening tables" y el backend se colgaba al iniciar sesión.
2. Reiniciado desde el panel, volvió a cortarse en plena corrida E2E, sin ningún mensaje de apagado en `C:\xampp\mysql\data\mysql_error.log`.

Sin base no corrieron ni Pest ni los E2E.

## Punto 1 — Backend nuevo sin ejecutar (Pest) — RESUELTO

Ningún test de estos archivos corrió nunca:
- `app/Contexts/Reporting/Interface/Http/PendientesController.php`: ahora devuelve contexto (`cantidad` + `items`), `meta.generado_at` y el lote vigente del consolidado.
- `app/Contexts/Audit/Interface/Http/ActividadController.php`: nuevo, `GET /api/v1/me/activity`.
- Los tests `tests/Feature/Sdd/PendientesTest.php` (reescrito), `tests/Feature/Sdd/ActividadTest.php` (nuevo) y `tests/Feature/DemoSeederTest.php` (ajustado).

Riesgos a revisar:
- La subconsulta de `matafuegos_vencidos` con `addSelect` y `count()` sobre la misma consulta, dentro de `conjunto()`.
- Que `ConsultasReportes::loteVigente()` devuelva las claves que espera el frontend: `estado`, `filas_con_error`, `unidades`.
- El cast de `after_json` en `ActividadController` cuando es `null`.
- Fechas `created_at` sin zona horaria en los tests de actividad.

### Prompt

```
Estoy en la rama mejoras/auditoria del repo seminario_indufor. Leé docs/pendientes-verificacion.md (punto 1).

Necesito verificar el backend nuevo del inicio, que nunca se ejecutó:
- backend/app/Contexts/Reporting/Interface/Http/PendientesController.php (devuelve cantidad + items y meta.generado_at; el consolidado usa ConsultasReportes::loteVigente)
- backend/app/Contexts/Audit/Interface/Http/ActividadController.php (GET /api/v1/me/activity: toda la operación con audit.view, si no solo lo propio)

Pasos:
1. Confirmá que hay PHP 8.4 con pdo_mysql y que MySQL/MariaDB responde; creá indufor_db_test si falta.
2. Corré `php -d memory_limit=-1 vendor/bin/pest tests/Feature/Sdd/PendientesTest.php tests/Feature/Sdd/ActividadTest.php tests/Feature/DemoSeederTest.php` dentro de backend/.
3. Si algo falla, decidí si el error está en el código o en el test: el contrato que consume el frontend está en frontend/src/features/inicio/api.ts (tipo Pendientes) y no debe cambiar sin actualizar features/inicio/reglas.ts y sus tests.
4. Después corré la suite completa (`vendor/bin/pest`) y `vendor/bin/pint --test`; todo tiene que quedar en verde.
5. Hacé un commit por corrección, con el motivo en el mensaje, y actualizá este documento marcando el punto 1 como resuelto.
```

## Punto 2 — E2E completos (sidebar, tema oscuro e inicio) — RESUELTO

Situación:
- La última corrida, con la sidebar y antes del inicio nuevo, dio 25/45 en verde. Del test 27 en adelante falló todo, cuando MySQL se cayó.
- **Duda sin resolver:** `e2e/fase1.spec.ts`, «administración carga un tipo de maquinaria y una unidad», falló **con la base todavía andando**. El tipo nuevo no apareció en la tabla del diálogo "Tipos". No quedó traza. Puede ser la base inestable o algo de la sidebar o del tema; hay que reproducirlo.
- Desde entonces cambió el inicio. Los E2E esperaban el título `/^Hola,/` y ahora esperan `navigation "Principal"`, en 12 archivos. Ese cambio no se probó contra el backend real.
- El contraste del tema oscuro nuevo no pasó por axe (`e2e/fase7-accesibilidad.spec.ts`).

### Prompt

```
Estoy en la rama mejoras/auditoria del repo seminario_indufor. Leé docs/pendientes-verificacion.md (punto 2). Hacé primero el punto 1 si no está resuelto.

Necesito la suite E2E completa en verde contra el backend real, después de tres cambios: la sidebar con íconos de @animateicons/react, el tema oscuro en toda la app y el inicio "Centro de operaciones".

Pasos:
1. Con MySQL/MariaDB arriba y PHP 8.4 (exportá PHP_BIN si `php` no es la 8.4), corré en frontend/: `npx playwright test e2e/fase1.spec.ts --reporter=line --trace on`. Si falla «administración carga un tipo de maquinaria y una unidad», abrí la traza y averiguá si la respuesta de POST /machinery-types llegó y por qué la fila no aparece (diálogo, z-index de la sidebar, foco, tema). Corregí la causa real, no el test.
2. Corré la suite completa `npx playwright test --reporter=line` y después `npm run e2e:offline`. Los 45 tests y los 2 offline tienen que pasar.
3. Si fase7-accesibilidad marca problemas de contraste del tema oscuro, ajustá los tokens en frontend/src/index.css (no colores sueltos) y actualizá docs/design-tokens.md con los valores nuevos.
4. Revisá a ojo el inicio con los usuarios de demo (`php artisan db:seed --class=DemoSeeder`, contraseña en SEED_DEMO_PASSWORD): Ana (admin), Elena (encargada), Carla (camionera), Marta (mantenimiento). Comprobá que cada uno vea solo lo suyo, que al atender la falla de SK-BP1 el inicio la descuente sin recargar y que sin señal muestre "Mostrando datos de las HH:MM".
5. Commits chicos con el motivo de cada corrección; marcá el punto 2 como resuelto en este documento.
```

## Si el MySQL de XAMPP vuelve a fallar

Revisá `C:\xampp\mysql\data\mysql_error.log` justo después de la caída. Si las tablas `sessions` o `cache` quedan trabadas, se pueden recrear: solo guardan sesiones y caché, datos descartables, con `php artisan migrate:fresh --seed` en una base de prueba. Para desarrollo conviene un MariaDB o MySQL instalado como servicio, en lugar del de XAMPP.
