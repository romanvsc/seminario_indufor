<?php

namespace App\Contexts\Frentes\Domain;

/** D04: la modalidad se fija por frente para que un frente nunca mezcle carga consolidada e individual. */
enum ModalidadProduccion: string
{
    case Consolidada = 'CONSOLIDADA';
    case Individual = 'INDIVIDUAL';
}
