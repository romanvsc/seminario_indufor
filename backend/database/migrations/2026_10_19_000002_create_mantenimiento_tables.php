<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/database.md §12.15–12.16 (+ atención de fallas, D20)
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lectura_mantenimiento', function (Blueprint $table) {
            $table->bigIncrements('id_lectura');
            $table->unsignedInteger('id_unidad');
            $table->unsignedInteger('id_operario_reporte');
            $table->dateTime('fecha_lectura');
            $table->decimal('horometro_actual', 12, 2)->nullable();
            $table->unsignedInteger('kilometraje_actual')->nullable();
            $table->boolean('tiene_falla')->default(false);
            $table->text('detalle_falla')->nullable();
            $table->dateTime('falla_atendida_at')->nullable();
            $table->unsignedInteger('id_usuario_atencion')->nullable();
            $table->text('nota_atencion')->nullable();
            $table->timestamps();

            $table->foreign('id_unidad')->references('id_unidad')->on('maquinaria')->restrictOnDelete();
            $table->foreign('id_operario_reporte')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->foreign('id_usuario_atencion')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->index(['id_unidad', 'fecha_lectura']);
            $table->index(['tiene_falla', 'falla_atendida_at']);
        });

        Schema::create('control_matafuego', function (Blueprint $table) {
            $table->bigIncrements('id_control');
            $table->unsignedInteger('id_unidad');
            $table->unsignedInteger('id_operario');
            $table->string('estado_matafuego', 40); // OK / DESCARGADO / DANADO / FALTANTE (D20)
            $table->date('fecha_revision');
            $table->date('fecha_vencimiento_carga');
            $table->timestamps();

            $table->foreign('id_unidad')->references('id_unidad')->on('maquinaria')->restrictOnDelete();
            $table->foreign('id_operario')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->index(['id_unidad', 'fecha_revision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('control_matafuego');
        Schema::dropIfExists('lectura_mantenimiento');
    }
};
