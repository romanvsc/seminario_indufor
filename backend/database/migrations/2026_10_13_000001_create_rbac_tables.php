<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * RBAC normalizado (docs/database.md §12.2–12.6): rol, permiso, rol_permiso, usuario_rol.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rol', function (Blueprint $table) {
            $table->increments('id_rol');
            $table->string('codigo', 40)->unique();
            $table->string('nombre', 80);
            $table->string('descripcion', 255)->nullable();
            $table->boolean('estado_activo')->default(true);
        });

        Schema::create('permiso', function (Blueprint $table) {
            $table->increments('id_permiso');
            $table->string('codigo', 100)->unique();
            $table->string('descripcion', 255)->nullable();
        });

        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->unsignedInteger('id_rol');
            $table->unsignedInteger('id_permiso');
            $table->primary(['id_rol', 'id_permiso']);
            $table->foreign('id_rol')->references('id_rol')->on('rol')->cascadeOnDelete();
            $table->foreign('id_permiso')->references('id_permiso')->on('permiso')->cascadeOnDelete();
            $table->index('id_permiso');
        });

        Schema::create('usuario_rol', function (Blueprint $table) {
            $table->unsignedInteger('id_usuario');
            $table->unsignedInteger('id_rol');
            $table->timestamp('created_at')->nullable();
            $table->primary(['id_usuario', 'id_rol']);
            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->cascadeOnDelete();
            $table->foreign('id_rol')->references('id_rol')->on('rol')->restrictOnDelete();
            $table->index('id_rol');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_rol');
        Schema::dropIfExists('rol_permiso');
        Schema::dropIfExists('permiso');
        Schema::dropIfExists('rol');
    }
};
