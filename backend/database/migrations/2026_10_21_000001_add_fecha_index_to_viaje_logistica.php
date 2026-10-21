<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fase 7 (performance): los reportes filtran viajes solo por rango de fechas; índice previsto en docs/database.md §15 (los existentes empiezan por estado o camionero)
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viaje_logistica', fn (Blueprint $t) => $t->index(['fecha', 'id_frente_origen']));
    }

    public function down(): void
    {
        Schema::table('viaje_logistica', fn (Blueprint $t) => $t->dropIndex(['fecha', 'id_frente_origen']));
    }
};
