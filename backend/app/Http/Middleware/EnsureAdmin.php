<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['admin', 'gestor'], true)) {
            abort(403, 'Acesso restrito ao painel administrativo.');
        }

        if ($user->role === 'admin') {
            $user->loadMissing('empresa:id,nome,status,limite_locais,data_validade');

            if (! $user->empresa || $user->empresa->licenca_bloqueada) {
                abort(403, $user->empresa?->licenca_mensagem ?: 'Licença da empresa indisponível.');
            }
        }

        return $next($request);
    }
}
