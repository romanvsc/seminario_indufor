<?php

namespace Database\Seeders;

use App\Contexts\Frentes\Domain\ModalidadProduccion;
use App\Contexts\Frentes\Infrastructure\FrenteModel;
use Illuminate\Database\Seeder;

/** Frentes operativos reales (docs/database.md §12.1, D04). Idempotente. */
class FrentesSeeder extends Seeder
{
    public function run(): void
    {
        $frentes = [
            'Papel Misionero' => ModalidadProduccion::Consolidada,
            'Bosques del Plata' => ModalidadProduccion::Consolidada,
            'Prusia' => ModalidadProduccion::Individual,
        ];
        foreach ($frentes as $nombre => $modalidad) {
            FrenteModel::firstOrCreate(['nombre_frente' => $nombre], ['modalidad_produccion' => $modalidad]);
        }
    }
}
