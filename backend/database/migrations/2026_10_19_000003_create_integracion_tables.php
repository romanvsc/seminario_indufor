<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/database.md §13 · contrato: docs/adr/ADR-004-contrato-csv-sistema-externo.md
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integracion_lote', function (Blueprint $table) {
            $table->bigIncrements('id_lote');
            $table->string('tipo', 40); // EXPORT_LECTURAS / IMPORT_CONSUMOS
            $table->char('periodo', 7)->nullable(); // YYYY-MM
            $table->string('nombre_archivo', 255)->nullable();
            $table->string('checksum', 128)->nullable();
            $table->string('estado', 30); // EN_PROCESO / OK / PARCIAL / ERROR / REEMPLAZADO
            $table->unsignedInteger('id_usuario')->nullable(); // null = el sistema (exportación automática)
            $table->dateTime('iniciado_at');
            $table->dateTime('finalizado_at')->nullable();
            $table->text('detalle_error')->nullable();

            $table->foreign('id_usuario')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->index(['tipo', 'estado', 'nombre_archivo']);
            $table->index(['tipo', 'periodo', 'estado']);
            $table->index('checksum');
        });

        Schema::create('consumo_importado', function (Blueprint $table) {
            $table->bigIncrements('id_consumo');
            $table->unsignedBigInteger('id_lote');
            $table->unsignedInteger('id_unidad');
            $table->char('periodo', 7);
            $table->decimal('litros', 12, 2);
            $table->decimal('costo_total', 14, 2);
            $table->string('referencia_externa', 120)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('id_lote')->references('id_lote')->on('integracion_lote')->restrictOnDelete();
            $table->foreign('id_unidad')->references('id_unidad')->on('maquinaria')->restrictOnDelete();
            // Un período tiene un solo consolidado vigente por unidad: dos lotes nunca se suman (D13)
            $table->unique(['periodo', 'id_unidad']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consumo_importado');
        Schema::dropIfExists('integracion_lote');
    }
};
