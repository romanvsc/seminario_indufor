---
name: indufor-laravel-backend
description: Convenciones del backend Laravel de INDUFOR - capas hexagonales por bounded context, Eloquent solo como adaptador, API versionada `/api/v1`, Form Requests, API Resources, formato uniforme de errores, paginación, autenticación Sanctum para SPA, Policies para RBAC, transacciones y política de migraciones en MySQL `indufor_db` sincronizadas con el DER del TP. Úsala siempre que se cree o modifique código PHP, rutas, controladores, casos de uso, repositorios, modelos, migraciones, seeders, policies o configuración de Laravel en este proyecto, aunque el cambio parezca un CRUD simple.
---

# Backend Laravel de INDUFOR

Laravel empuja a poner todo en el modelo y el controlador. Este proyecto separa el dominio porque las reglas críticas (cotejo exacto, no regresión de lecturas, idempotencia) deben poder probarse sin base de datos ni HTTP, y porque la cátedra evalúa la separación de responsabilidades.

Fuentes: `Context.md` §3, §7, §17, §21 · `docs/database.md` · skill `clean-ddd-hexagonal` para los patrones generales.

## Estructura

```text
app/
└── Contexts/
    └── <Contexto>/                  # Production, Logistics, Maintenance, ...
        ├── Domain/                  # PHP puro: entidades, value objects, reglas, eventos, excepciones
        ├── Application/             # casos de uso, commands/queries, DTOs, puertos (interfaces)
        ├── Infrastructure/
        │   ├── Persistence/         # modelos Eloquent + repositorios que implementan puertos
        │   └── ExternalSystems/     # adaptadores (solo External Costs Integration)
        └── Interface/Http/          # controllers, Form Requests, Resources
```

- **Domain no importa nada de `Illuminate\*`.** Ni facades ni Carbon de Laravel ni modelos Eloquent. Agregar un test de arquitectura (Pest `arch()`) que lo verifique.
- Application depende de Domain y de interfaces (puertos). Infrastructure implementa los puertos y se enlaza en un ServiceProvider por contexto.
- Controllers delgados: validar (Form Request) → autorizar (Policy) → llamar al caso de uso → devolver un Resource.
- El nombre de una carpeta de contexto coincide con los de `indufor-domain-map`.

## API

- Prefijo `/api/v1`. Familias de recursos en `Context.md` §17.
- Respuestas con **API Resources**; nunca devolver un modelo Eloquent crudo ni exponer columnas internas.
- Listados siempre paginados; filtros explícitos y validados en el Form Request.
- Formato de error uniforme. La propuesta queda vigente hasta que la convención se apruebe por ADR en Fase 0:

```json
{ "error": { "code": "LECTURA_REGRESIVA", "message": "La lectura es menor que la anterior (12.430 h).", "details": { "lectura_anterior": "12430.00" } } }
```

  Errores de validación: 422 con `details` por campo. Errores de regla de negocio: 422 con `code` estable. Autorización: 403. Nunca devolver trazas ni SQL al cliente.
- Un ID en la URL no implica permiso: siempre Policy.

## Autenticación y autorización

- Sanctum en modo SPA (cookies de sesión + CSRF). El frontend llama a `/sanctum/csrf-cookie` antes del login. CORS explícito con `supports_credentials`.
- Rate limiting en login y en endpoints sensibles.
- Permisos de `Context.md` §10 cargados por seeder; cada Policy consulta permisos, nunca nombres de rol sueltos en el código.

## Persistencia y migraciones

- Migraciones como **única** fuente del esquema. InnoDB, `utf8mb4`, base `indufor_db`.
- Nombres de tablas y columnas como en `docs/database.md` (español, `snake_case`). Como los nombres no siguen la convención de Laravel, declarar `$table` y `$primaryKey` en cada modelo.
- FKs con índice, dinero con `DECIMAL`, sin `FLOAT`. Enums de negocio como value objects más una restricción.
- Operaciones multi-registro (cotejo, importación) dentro de `DB::transaction`.
- Ninguna migración destructiva sin estrategia de rollback.
- **Regla de la cátedra:** cada tabla o columna de dominio nueva se refleja en el DER, el modelo relacional y el diccionario del PDF. Si no se puede actualizar el PDF en el momento, agregar la entrada en `docs/cambios-pdf.md` en el mismo cambio (skill `indufor-adr-docs`).

## Antes de cerrar un cambio de backend

- [ ] Tests de dominio sin base de datos para las reglas nuevas.
- [ ] Test de feature del endpoint: 200/201, 422, 403 y 401.
- [ ] Test de arquitectura en verde.
- [ ] Migración probada con `migrate:fresh --seed` y con rollback.
- [ ] `docs/database.md` y `docs/cambios-pdf.md` actualizados si cambió el esquema.
