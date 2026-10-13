<?php

namespace App\Contexts\IdentityAccess\Interface\Http;

use Illuminate\Foundation\Http\FormRequest;

final class LoginRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:190'],
            'password' => ['required', 'string', 'max:255'],
            'recordar' => ['sometimes', 'boolean'],
        ];
    }
}
