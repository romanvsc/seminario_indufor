<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/database.md §12.10 y §12.11
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tipo_madera', function (Blueprint $table) {
            $table->increments('id_tipo_madera');
            $table->string('nombre', 60)->unique();
            $table->boolean('estado_activo')->default(true);
        });

        Schema::create('produccion', function (Blueprint $table) {
            $table->bigIncrements('id_produccion');
            $table->unsignedInteger('id_unidad');
            $table->unsignedInteger('id_usuario'); // quien registra
            $table->unsignedInteger('id_operario')->nullable(); // operario productor (D04)
            $table->unsignedInteger('id_frente');
            $table->unsignedInteger('tipo_madera');
            $table->date('fecha_registro'); // jornada del parte, no created_at
            $table->decimal('cantidad_toneladas', 10, 2)->nullable();
            $table->decimal('metros_cubicos', 10, 2)->nullable();
            $table->string('foto_soporte', 255)->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->foreign('id_unidad')->references('id_unidad')->on('maquinaria')->restrictOnDelete();
            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->foreign('id_operario')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->foreign('id_frente')->references('id_frente')->on('frente_trabajo')->restrictOnDelete();
            $table->foreign('tipo_madera')->references('id_tipo_madera')->on('tipo_madera')->restrictOnDelete();
            $table->index(['id_frente', 'fecha_registro']);
            $table->index(['fecha_registro', 'tipo_madera']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produccion');
        Schema::dropIfExists('tipo_madera');
    }
};
