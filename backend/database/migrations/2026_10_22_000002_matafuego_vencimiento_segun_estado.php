<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// D24 (specs/06): el vencimiento de carga depende del estado; nunca se guarda una fecha ficticia.
// Los datos existentes no cambian: todos tienen fecha. El down solo es posible si no quedaron controles sin fecha.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('control_matafuego', function (Blueprint $table) {
            $table->date('fecha_vencimiento_carga')->nullable()->change();
            $table->boolean('etiqueta_ilegible')->default(false)->after('fecha_vencimiento_carga');
        });
    }

    public function down(): void
    {
        Schema::table('control_matafuego', function (Blueprint $table) {
            $table->dropColumn('etiqueta_ilegible');
            $table->date('fecha_vencimiento_carga')->nullable(false)->change();
        });
    }
};
