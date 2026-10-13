<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/database.md §12.1 y §12.7
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frente_trabajo', function (Blueprint $table) {
            $table->increments('id_frente');
            $table->string('nombre_frente', 100)->unique();
            $table->string('ubicacion_geografica', 150)->nullable();
            $table->string('modalidad_produccion', 20); // CONSOLIDADA / INDIVIDUAL (D04)
            $table->boolean('estado_activo')->default(true);
            $table->timestamps();
        });

        Schema::create('frente_asignado', function (Blueprint $table) {
            $table->increments('id_asignacion');
            $table->unsignedInteger('id_frente');
            $table->unsignedInteger('id_usuario');
            $table->date('fecha_desde');
            $table->date('fecha_hasta')->nullable();
            $table->timestamps();

            $table->foreign('id_frente')->references('id_frente')->on('frente_trabajo')->restrictOnDelete();
            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->index(['id_usuario', 'fecha_desde']);
            $table->index(['id_frente', 'fecha_desde']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frente_asignado');
        Schema::dropIfExists('frente_trabajo');
    }
};
