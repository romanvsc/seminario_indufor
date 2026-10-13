<?php

namespace App\Contexts\Shared\Application;

/** Puerto de transacción: los casos de uso multi-registro corren completos o no corren. */
interface Transaccion
{
    /**
     * @template T
     *
     * @param  callable(): T  $operacion
     * @return T
     */
    public function ejecutar(callable $operacion): mixed;
}
