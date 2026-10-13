<?php

namespace App\Contexts\Frentes\Interface\Http;

use App\Contexts\Frentes\Domain\ModalidadProduccion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Alta (POST) y modificación (PUT) de frentes. */
final class FrenteRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nombre_frente' => ['required', 'string', 'max:100', Rule::unique('frente_trabajo', 'nombre_frente')->ignore($this->route('frente'), 'id_frente')],
            'ubicacion_geografica' => ['nullable', 'string', 'max:150'],
            'modalidad_produccion' => ['required', Rule::enum(ModalidadProduccion::class)],
        ];
    }
}
