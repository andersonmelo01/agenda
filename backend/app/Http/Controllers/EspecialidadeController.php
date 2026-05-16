<?php

namespace App\Http\Controllers;

use App\Models\Especialidade;
use Illuminate\Http\Request;

class EspecialidadeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(
            Especialidade::query()
                ->orderBy('nome')
                ->get()
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
        ]);
        $especialidade = Especialidade::create($validated);
        return response()->json($especialidade, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Especialidade $especialidade)
    {
        return response()->json($especialidade);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Especialidade $especialidade)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Especialidade $especialidade)
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'string', 'max:255'],
        ]);
        $especialidade->update($validated);
        return response()->json($especialidade);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Especialidade $especialidade)
    {
        $especialidade->delete();
        return response()->json(['message' => 'Especialidade removida com sucesso.']);
    }
}
