<?php

namespace App\Contexts\IdentityAccess\Interface\Http;

use App\Contexts\IdentityAccess\Domain\Rol;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Alta (POST) y modificación (PUT) de usuarios. En la modificación la contraseña es opcional. */
final class UsuarioRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $creando = $this->isMethod('post');
        $id = $this->route('usuario');

        return [
            'nombre' => ['required', 'string', 'max:80'],
            'apellido' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:190', Rule::unique('usuario', 'email')->ignore($id, 'id_usuario')],
            'password' => [$creando ? 'required' : 'sometimes', 'string', Password::min(8)->letters()->numbers(), 'max:255'],
            'telefono_whatsapp' => ['nullable', 'string', 'max:30'],
            'roles' => [$creando ? 'required' : 'prohibited', 'array', 'min:1'],
            'roles.*' => ['string', 'distinct', Rule::enum(Rol::class)],
        ];
    }

    /** @return array<string, mixed> */
    public function datosUsuario(): array
    {
        return $this->safe()->only(['nombre', 'apellido', 'email', 'password', 'telefono_whatsapp']);
    }
}
