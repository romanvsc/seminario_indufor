<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Tabla técnica de reintentos sin duplicados (D22, specs/05-idempotencia.md). Reemplaza la caché de 24 h.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idempotencia', function (Blueprint $table) {
            $table->bigIncrements('id_idempotencia');
            $table->unsignedInteger('id_usuario');
            $table->string('operacion', 20); // parte / viaje / lectura
            $table->string('clave', 64);
            $table->char('hash_contenido', 64);
            $table->unsignedBigInteger('entidad_id')->nullable(); // se completa en la misma transacción que el alta
            $table->timestamp('created_at')->nullable();

            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->restrictOnDelete();
            // La garantía de "una clave, un registro" la da este índice, no un chequeo previo (sirve con envíos simultáneos)
            $table->unique(['id_usuario', 'operacion', 'clave']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotencia');
    }
};
