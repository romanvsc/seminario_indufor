# Guion de demostración — defensa del TP

> Duración aproximada: 20 minutos. Un usuario por rol en las tres unidades forestales (Papel Misionero, Bosques del Plata, Prusia).
> Cada paso indica qué requerimiento muestra; el detalle técnico de cada uno está en `docs/trazabilidad.md`.

## 1. Preparación (una vez, antes de la defensa)

```bash
cd backend
# .env: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (administrador) y SEED_DEMO_PASSWORD (usuarios de demo)
php artisan migrate:fresh --seed          # base limpia: roles, frentes, tipos de madera, administrador
php artisan db:seed --class=DemoSeeder    # usuarios, flota y registros de muestra (no corre en producción)
php artisan serve                          # API en http://127.0.0.1:8000
cd ../frontend && npm run dev              # app en http://localhost:5173
```

Usar dos ventanas: una de escritorio y otra con el modo celular del navegador (390 px de ancho) para las pantallas de campo.

### Usuarios (contraseña: la de `SEED_DEMO_PASSWORD`)

| Rol | Usuario | Frente / a cargo |
|---|---|---|
| Administración | `ana.adm@indufor.demo` | — |
| Gerencia | `gustavo.ger@indufor.demo` | — |
| Encargado | `elena.enc@indufor.demo` | Papel Misionero (carga consolidada) |
| Encargado | `bruno.enc@indufor.demo` | Bosques del Plata |
| Operario | `omar.ope@indufor.demo` | Prusia (carga individual); responsable de la camioneta CT-01 |
| Camionero | `carla.cam@indufor.demo` | responsable del camión CM-01 |
| Logística | `lucas.log@indufor.demo` | — |
| Mantenimiento | `marta.man@indufor.demo` | — |

### Lo que deja cargado `DemoSeeder`

- **Producción de la quincena:** dos partes consolidados de Elena en Papel Misionero (pulpable y aserrable) y uno individual de Omar en Prusia.
- **Lecturas:** HV-PM1 **sin lectura desde el lunes**; SK-BP1 con una **falla abierta** (display del horómetro); HV-PR1 leída esta semana.
- **Matafuegos:** HV-PR1 con la **carga vencida**; HV-PM1 al día.
- **Viajes:** uno **validado** con su remito y otro **esperando remito**.

## 2. Recorrido

### Campo, desde el celular (RF01–RF04, RF09–RF11, RNF01, RNF05) — Elena

1. **Inicio por rol.** Muestra accesos grandes y el pendiente "1 unidad sin lectura desde el lunes" (spec 07).
2. **Menú.** El botón "Menú" despliega las secciones Campo, Operación y Gestión.
3. **Cargar parte** (RF01–RF03):
   - el frente se preselecciona y se indica "Carga consolidada";
   - elegir máquina, madera y toneladas, y enviar;
   - la constancia queda en pantalla con número, hora y datos;
   - "Cargar otro" trae la misma máquina precargada.
4. **Foto** (RF04): adjuntar una foto opcional desde "Ver mis partes".
5. **Lectura de HV-PM1** (RF09, RNF05):
   - escribir un valor menor a 1250,5: la pantalla muestra la lectura anterior y bloquea el envío;
   - corregir el valor y enviar.
6. **Alcance por frente** (D28): en "Unidad" solo aparecen las unidades de Papel Misionero, no las de Prusia.
7. **Corrección** (spec 03, D25): en Producción, "Corregir" un parte propio exige el motivo y deja la auditoría.

### Operario de Prusia — Omar

8. **Carga individual** en Prusia (RF03): Omar queda como productor del parte.
9. **Máquina trasladada** (D30): elegir una máquina de otro frente muestra un aviso, pero el envío se permite.

### Camionero — Carla

10. **Declarar un viaje** (RF05): Bosques del Plata no se ofrece como origen. El viaje queda **pendiente de remito**.

### Administración, en escritorio (RF06–RF08, RF12–RF13) — Ana

11. **Inicio.** Muestra "2 viajes esperan remito" (el del seeder y el de Carla) y "Falta importar el consolidado…".
12. **Cargar remito idéntico** (RF06–RF07): el viaje pasa solo a **VALIDADO**, sin aprobación manual.
13. **Remito con otra cantidad** (RF08):
    - genera una **solicitud de corrección** con el detalle de la diferencia;
    - en Correcciones, se corrige con motivo y se recoteja.
14. **Integración** (RF12–RF13):
    - la lectura de Elena ya se **exportó sola**;
    - descargar el consolidado del **simulador** del mes vencido e importarlo;
    - reimportar el mismo archivo no duplica nada.
15. **Búsqueda** (spec 08): en Viajes, buscar por número de remito.

### Mantenimiento — Marta

16. **Inicio.** Muestra "1 falla abierta" y "1 matafuego con la carga vencida", y el menú tiene el contador de fallas (RF10, ADR-003).
17. **Panel técnico** (RF09–RF11):
    - marcar la falla de SK-BP1 como **atendida** con una nota;
    - ver el matafuego vencido de HV-PR1.
18. **Historial de la unidad** (spec 08): tocar SK-BP1 muestra sus lecturas, la falla con su atención y los controles.

### Gerencia — Gustavo (RF14–RF16, RNF03)

19. **Dashboard:** producción de la quincena separada por madera.
20. **Reportes:**
    - quincenal (RF14);
    - consolidado mensual del período vencido con los consumos importados (RF15);
    - filtros históricos por fechas, máquina y operario (RF16), que quedan en la URL.
21. **Seguridad** (RNF03): con Elena, la ruta `/reportes` no está disponible, y la API responde 403.

### Cierre (RNF02, RNF03)

22. **Salir sin señal:** con la red del navegador cortada (DevTools → Offline), "Salir" avisa que la sesión sigue abierta y ofrece reintentar. Nunca finge el cierre.
23. **Formulario sin señal:** queda como **borrador** en el equipo y el inicio lo lista. Nada figura como "guardado" sin confirmación del servidor.

## 3. Qué decir sobre los límites

- **Sistema de gastos (RF12–RF13):** el intercambio es por CSV con contrato versionado (ADR-004), demostrado con el simulador. El adaptador aislado permite conectar el sistema real sin tocar el dominio.
- **RNF04:** el despliegue está preparado (ADR-005, `docs/runbook.md`), pero el 99,5 % se mide recién con el sistema en producción.
- **Consumos por frente u operario:** el sistema externo informa por máquina y mes, y la app lo muestra como "no disponible" en vez de inventar un desglose (D09).
