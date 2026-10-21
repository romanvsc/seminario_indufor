# Runbook — INDUFOR

Operación del sistema en producción. Decisiones de fondo en `docs/adr/ADR-005-destino-de-deploy.md`.
Rutas de ejemplo: código en `/srv/indufor`, SPA en `/var/www/indufor-app`, backups en `/var/backups/indufor`.

## 1. Primer despliegue (una sola vez)

1. **Servidor:** Ubuntu LTS con `nginx`, `php8.4-fpm` (extensiones `mysql`, `mbstring`, `intl`, `zip`, `gd`, `xml`, `curl`), `mariadb-server` 10.11, `composer`, Node 24, `rsync` y `certbot`.
2. **Base de datos:** crear `indufor_db` en utf8mb4 y un usuario propio con permisos solo sobre esa base, nunca root:
   ```sql
   CREATE DATABASE indufor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'indufor'@'localhost' IDENTIFIED BY '<contraseña larga>';
   GRANT ALL PRIVILEGES ON indufor_db.* TO 'indufor'@'localhost';
   ```
3. **Código:** `git clone https://github.com/romanvsc/seminario_indufor.git /srv/indufor`.
4. **Configuración:**
   - copiar `deploy/backend.env.production.example` a `backend/.env` y completarlo;
   - correr `php artisan key:generate` dentro de `backend/`;
   - copiar `deploy/frontend.env.production.example` a `frontend/.env.production`.
5. **Permisos:** `backend/storage` y `backend/bootstrap/cache` tienen que ser escribibles por el usuario de PHP-FPM (`www-data`).
6. **Nginx y HTTPS:**
   - copiar `deploy/nginx.conf` a `/etc/nginx/sites-available/indufor`, reemplazar el dominio y activarlo;
   - correr `certbot --nginx -d app.<dominio> -d api.<dominio>`.
7. **Primer deploy:** `deploy/scripts/deploy.sh v1.0.0`.
8. **Primer administrador:** `cd backend && php artisan usuarios:crear-admin <email>`. La contraseña se pide oculta y no queda en el historial.
9. **Cron** (`crontab -e` del usuario de la aplicación):
   ```cron
   * * * * *  cd /srv/indufor/backend && php artisan schedule:run >> /dev/null 2>&1
   30 2 * * * /srv/indufor/deploy/scripts/backup.sh >> /var/log/indufor-backup.log 2>&1
   ```
10. **Verificación:**
    - `https://api.<dominio>/up` responde 200;
    - el login funciona desde `https://app.<dominio>`;
    - una lectura de prueba aparece como exportada en Integración.

## 2. Deploy de una versión nueva

1. En el repositorio, con el CI en verde: `git tag v1.x.y && git push --tags`.
2. En el servidor: `cd /srv/indufor && deploy/scripts/deploy.sh v1.x.y`.
   El script hace el backup, el checkout, las dependencias, el modo mantenimiento, las migraciones, los catálogos, `optimize`, el build de la SPA y la publicación.
3. **Controles:**
   - `/up` responde 200;
   - el login funciona;
   - el dashboard carga;
   - el log no tiene errores nuevos: `tail -n 50 backend/storage/logs/laravel-$(date +%F).log`.

## 3. Rollback

- **Falla de código y la versión no migró la base:** `deploy/scripts/rollback.sh`. Vuelve al commit y a la SPA anteriores.
- **Una migración rompió datos:** `deploy/scripts/rollback.sh --con-base`. Además restaura el backup tomado por `deploy.sh`.
  Se pierde lo cargado después del deploy: avisar a Administración para que se vuelva a cargar.

## 4. Backup y restauración

- **Backup:** `deploy/scripts/backup.sh` corre todos los días por cron y también al inicio de cada deploy.
  - Deja `indufor-<fecha>.sql.gz` (base) y `indufor-<fecha>.archivos.tar.gz` (fotos de partes y buzón de integración).
  - Verifica que el dump esté completo.
  - Borra los backups de más de `BACKUP_RETENCION_DIAS` días.
  - Con `BACKUP_GPG_RECIPIENT`, cifra los archivos.
- **Copia fuera del servidor:** sincronizar `/var/backups/indufor` con otro destino (otro servidor o un bucket). Un backup que vive solo en el mismo disco no protege de la pérdida del servidor.
- **Restaurar:**
  ```bash
  deploy/scripts/backup.sh                     # primero, el estado actual (por si hay que volver)
  deploy/scripts/restore.sh /var/backups/indufor/indufor-AAAAMMDD-HHMMSS.sql.gz \
                            /var/backups/indufor/indufor-AAAAMMDD-HHMMSS.archivos.tar.gz --confirmar
  ```
  Si el backup está cifrado, antes hay que descifrarlo con `gpg --decrypt`.
- **Prueba periódica:** una vez por mes, restaurar el último backup en una base aparte para comprobar que sirve:
  ```bash
  DB_DATABASE=indufor_db_prueba deploy/scripts/restore.sh <archivo>.sql.gz --confirmar
  ```

## 5. Rotación de credenciales

| Credencial | Cuándo | Cómo |
|---|---|---|
| Contraseña del usuario `indufor` de MariaDB | Cada 6 meses o si se expuso | `ALTER USER`, actualizar `DB_PASSWORD` y correr `php artisan optimize` |
| `APP_KEY` | Solo si se expuso | `php artisan key:generate` invalida sesiones y datos cifrados (sesiones con `SESSION_ENCRYPT`); avisar que todos vuelven a iniciar sesión |
| Usuarios de la aplicación | Al irse alguien | Deshabilitarlo desde Usuarios (nunca se borra) |
| Clave GPG de backups | Si se expuso | Generar una nueva y cambiar `BACKUP_GPG_RECIPIENT`; guardar la privada fuera del servidor |

## 6. Incidentes frecuentes

| Síntoma | Qué mirar | Acción |
|---|---|---|
| Integración muestra "lecturas pendientes de envío" | Columna Detalle del historial | Corregir la causa (permisos de `storage/app/private/integracion/salida`) y tocar "Reintentar envío". El cron también reintenta cada 15 minutos |
| "Ese período ya tiene un consolidado" al importar | Historial de Integración | Si el sistema externo mandó una corrección, importar con "Reemplazar" y motivo |
| Error 419 "La sesión expiró" | Reloj del servidor y `SESSION_DOMAIN` | La SPA renueva el CSRF sola; si persiste, revisar que el dominio de la cookie sea `.<dominio>` |
| Error 429 | Un usuario o script hace demasiados pedidos | Subir `API_MAX_PER_MINUTE` solo si es tráfico legítimo |
| Error 500 | `backend/storage/logs/laravel-<fecha>.log` | El cliente nunca ve la traza (ADR-002); buscar por la hora del error en el log |
| La PWA no se actualiza | Aviso "Hay una versión nueva" | Confirmar que Nginx sirve `sw.js` e `index.html` con `no-cache` |

## 7. Logs y trazabilidad

- **Aplicación:** `backend/storage/logs/laravel-<fecha>.log`, diario, nivel `warning`, 30 días. Sin contraseñas ni tokens.
- **Auditoría funcional:** tabla `auditoria_evento`. Guarda altas, correcciones, cotejos, importaciones y consultas financieras, con usuario, antes/después y `correlation_id`.
- **Nginx:** `/var/log/nginx/access.log` y `/var/log/nginx/error.log`.
