<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit & Traceability (docs/database.md §14). Solo inserción: no hay updated_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditoria_evento', function (Blueprint $table) {
            $table->bigIncrements('id_evento');
            $table->unsignedInteger('id_usuario')->nullable();
            $table->string('bounded_context', 60);
            $table->string('accion', 80);
            $table->string('entidad', 100);
            $table->string('entidad_id', 100)->nullable();
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->string('correlation_id', 100)->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->nullOnDelete();
            $table->index(['entidad', 'entidad_id', 'created_at']);
            $table->index(['id_usuario', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria_evento');
    }
};
