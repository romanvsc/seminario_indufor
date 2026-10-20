<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/database.md §12.12–12.14
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('viaje_logistica', function (Blueprint $table) {
            $table->bigIncrements('id_viaje');
            $table->unsignedInteger('id_unidad_camion');
            $table->unsignedInteger('id_usuario_camionero');
            $table->unsignedInteger('id_frente_origen');
            $table->dateTime('fecha');
            $table->string('destino', 150);
            $table->unsignedInteger('tipo_madera');
            $table->decimal('volumen_declarado', 10, 2); // toneladas (D06)
            $table->text('observaciones')->nullable();
            $table->string('estado_validacion', 30); // PENDIENTE / VALIDADO / CORRECCION_SOLICITADA
            $table->timestamps();

            $table->foreign('id_unidad_camion')->references('id_unidad')->on('maquinaria')->restrictOnDelete();
            $table->foreign('id_usuario_camionero')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->foreign('id_frente_origen')->references('id_frente')->on('frente_trabajo')->restrictOnDelete();
            $table->foreign('tipo_madera')->references('id_tipo_madera')->on('tipo_madera')->restrictOnDelete();
            $table->index(['estado_validacion', 'fecha']);
            $table->index(['id_usuario_camionero', 'fecha']);
        });

        Schema::create('remito', function (Blueprint $table) {
            $table->string('numero_remito', 50)->primary(); // D07
            $table->unsignedBigInteger('id_viaje')->unique(); // 1:1 con el viaje
            $table->date('fecha_remito');
            $table->unsignedInteger('id_transportista'); // dato documental del remito (D05)
            $table->unsignedInteger('tipo_madera_remito');
            $table->decimal('volumen_toneladas_remito', 10, 2);
            $table->dateTime('fecha_recepcion_admin');
            $table->timestamps();

            $table->foreign('id_viaje')->references('id_viaje')->on('viaje_logistica')->restrictOnDelete();
            $table->foreign('id_transportista')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->foreign('tipo_madera_remito')->references('id_tipo_madera')->on('tipo_madera')->restrictOnDelete();
        });

        Schema::create('solicitud_correccion', function (Blueprint $table) {
            $table->bigIncrements('id_solicitud');
            $table->unsignedBigInteger('id_viaje');
            $table->dateTime('fecha_solicitud');
            $table->text('detalle_diferencias');
            $table->string('estado', 30); // PENDIENTE / EN_REVISION / RESUELTA
            $table->dateTime('fecha_resolucion')->nullable();
            $table->unsignedInteger('id_usuario_responsable')->nullable();
            $table->timestamps();

            $table->foreign('id_viaje')->references('id_viaje')->on('viaje_logistica')->restrictOnDelete();
            $table->foreign('id_usuario_responsable')->references('id_usuario')->on('usuario')->restrictOnDelete();
            $table->index(['estado', 'fecha_solicitud']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitud_correccion');
        Schema::dropIfExists('remito');
        Schema::dropIfExists('viaje_logistica');
    }
};
