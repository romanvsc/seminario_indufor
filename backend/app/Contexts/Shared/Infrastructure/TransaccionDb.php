<?php

namespace App\Contexts\Shared\Infrastructure;

use App\Contexts\Shared\Application\Transaccion;
use Illuminate\Support\Facades\DB;

final class TransaccionDb implements Transaccion
{
    public function ejecutar(callable $operacion): mixed
    {
        return DB::transaction($operacion);
    }
}
