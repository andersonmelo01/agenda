<?php

namespace App\Http\Controllers;

use App\Models\Plano;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlanoController extends Controller
{
    public function index()
    {
        return response()->json(
            Plano::query()
                ->withCount('empresas')
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validatePlano($request);
        $validated = $this->normalizePlano($validated);

        return response()->json(Plano::create($validated), 201);
    }

    public function show(Plano $plano)
    {
        return response()->json($plano->loadCount('empresas'));
    }

    public function update(Request $request, Plano $plano)
    {
        $validated = $this->validatePlano($request, $plano);
        $validated = $this->normalizePlano($validated, $plano);

        $plano->update($validated);

        return response()->json($plano->refresh()->loadCount('empresas'));
    }

    public function destroy(Plano $plano)
    {
        if ($plano->empresas()->exists()) {
            abort(422, 'Este plano possui empresas vinculadas e não pode ser removido.');
        }

        $plano->delete();

        return response()->json(['message' => 'Plano removido com sucesso.']);
    }

    private function validatePlano(Request $request, ?Plano $plano = null): array
    {
        return $request->validate([
            'nome' => ['required', 'string', 'max:120'],
            'codigo' => [
                'required',
                'string',
                'max:40',
                Rule::unique('planos', 'codigo')->ignore($plano?->id),
            ],
            'descricao' => ['nullable', 'string'],
            'preco_base' => ['nullable', 'numeric', 'min:0'],
            'preco_por_local' => ['nullable', 'numeric', 'min:0'],
            'limite_locais' => ['nullable', 'integer', 'min:1'],
            'ativo' => ['sometimes', 'boolean'],
        ]);
    }

    private function normalizePlano(array $validated, ?Plano $plano = null): array
    {
        $codigo = strtolower($validated['codigo'] ?? $plano?->codigo ?? '');
        $validated['codigo'] = $codigo;

        if ($codigo === 'start') {
            $validated['limite_locais'] = 1;
        }

        if ($codigo === 'pro') {
            $validated['limite_locais'] = null;
        }

        $validated['preco_base'] = $validated['preco_base'] ?? $plano?->preco_base ?? 0;
        $validated['preco_por_local'] = $validated['preco_por_local'] ?? $plano?->preco_por_local ?? 0;
        $validated['ativo'] = $validated['ativo'] ?? $plano?->ativo ?? true;

        return $validated;
    }
}
