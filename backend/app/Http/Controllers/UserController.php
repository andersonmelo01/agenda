<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->with('empresa:id,nome,status,limite_locais,data_validade')
            ->select('id', 'empresa_id', 'name', 'email', 'role')
            ->orderBy('name');

        if ($request->user()?->role === 'admin') {
            $query->where(function ($users) use ($request) {
                $users
                    ->where('role', 'cliente')
                    ->orWhere('empresa_id', $request->user()->empresa_id);
            });
        }

        return response()->json(
            $query->get()
        );
    }
}
