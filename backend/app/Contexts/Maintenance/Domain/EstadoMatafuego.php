<?php

namespace App\Contexts\Maintenance\Domain;

/** RF11, D20: estados del control mensual. El vencimiento de carga se evalúa aparte, por fecha. */
enum EstadoMatafuego: string
{
    case Ok = 'OK';
    case Descargado = 'DESCARGADO';
    case Danado = 'DANADO';
    case Faltante = 'FALTANTE';
}
