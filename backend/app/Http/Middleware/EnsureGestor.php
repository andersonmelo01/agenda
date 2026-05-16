<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGestor
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'gestor') {
            abort(403, 'Acesso restrito ao gestor do SaaS.');
        }

        return $next($request);
    }
}
