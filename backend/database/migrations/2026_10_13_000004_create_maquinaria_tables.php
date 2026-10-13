<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/database.md §12.8 y §12.9
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tipo_maquinaria', function (Blueprint $table) {
            $table->increments('id_tipo_maquinaria');
            $table->string('nombre', 80)->unique();
            $table->string('metrica', 20); // HOROMETRO / KILOMETRAJE (D08)
            $table->boolean('estado_activo')->default(true);
        });

        Schema::create('maquinaria', function (Blueprint $table) {
            $table->increments('id_unidad');
            $table->string('nombre', 100);
            $table->string('dominio_patente', 20)->nullable()->unique();
            $table->string('marca_modelo', 120);
            $table->unsignedInteger('id_frente_actual')->nullable();
            $table->unsignedInteger('id_tipo_maquinaria');
            $table->unsignedInteger('id_usuario')->nullable();
            $table->boolean('estado_activo')->default(true);
            $table->timestamps();

            $table->foreign('id_frente_actual')->references('id_frente')->on('frente_trabajo')->restrictOnDelete();
            $table->foreign('id_tipo_maquinaria')->references('id_tipo_maquinaria')->on('tipo_maquinaria')->restrictOnDelete();
            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maquinaria');
        Schema::dropIfExists('tipo_maquinaria');
    }
};
