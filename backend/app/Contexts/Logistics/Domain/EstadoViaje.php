<?php

namespace App\Contexts\Logistics\Domain;

/** El viaje nace PENDIENTE; solo el cotejo lo lleva a VALIDADO o a CORRECCION_SOLICITADA. */
enum EstadoViaje: string
{
    case Pendiente = 'PENDIENTE';
    case Validado = 'VALIDADO';
    case CorreccionSolicitada = 'CORRECCION_SOLICITADA';

    /** RF05: Bosques del Plata produce, pero no es origen habilitado de viajes. Ampliarlo requiere cambio de RF. */
    public const ORIGENES_HABILITADOS = ['Papel Misionero', 'Prusia'];
}
