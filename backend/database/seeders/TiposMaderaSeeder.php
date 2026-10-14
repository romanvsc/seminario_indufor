<?php

namespace Database\Seeders;

use App\Contexts\Production\Infrastructure\TipoMaderaModel;
use Illuminate\Database\Seeder;

/** Catálogo obligatorio (RF01, docs/database.md §12.10). Idempotente. */
class TiposMaderaSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['pulpable', 'aserrable'] as $nombre) {
            TipoMaderaModel::firstOrCreate(['nombre' => $nombre]);
        }
    }
}
