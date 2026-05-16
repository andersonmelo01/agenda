<?php

namespace App\Http\Controllers;

use App\Models\Profissional;
use Illuminate\Http\Request;

class ProfissionalController extends Controller
{
    private function scopedQuery(Request $request)
    {
        $query = Profissional::query()
            ->with('estabelecimento:id,empresa_id,nome')
            ->orderBy('nome');

        if ($request->user()?->role === 'admin') {
            $query->whereHas('estabelecimento', fn ($estabelecimento) => $estabelecimento->where('empresa_id', $request->user()->empresa_id));
        }

        return $query;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = $this->scopedQuery($request);

        if ($request->filled('estabelecimento_id')) {
            $query->where('estabelecimento_id', $request->input('estabelecimento_id'));
        }

        return response()->json($query->get());
    }

    public function publicIndex(Request $request)
    {
        $query = Profissional::query()
            ->with('estabelecimento:id,empresa_id,nome')
            ->whereHas('estabelecimento', fn ($estabelecimento) => $estabelecimento->comAtendimentoAtivo())
            ->select(['id', 'estabelecimento_id', 'nome'])
            ->orderBy('nome');

        if ($request->filled('estabelecimento_id')) {
            $query->where('estabelecimento_id', $request->input('estabelecimento_id'));
        }

        return response()->json($query->get());
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
            'estabelecimento_id' => ['required', 'exists:estabelecimentos,id'],
            'nome' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);
        $this->authorizeEstabelecimento($request, (int) $validated['estabelecimento_id']);
        $profissional = Profissional::create($validated);
        return response()->json($profissional, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Profissional $profissional)
    {
        $this->authorizeProfissional(request(), $profissional);
        return response()->json($profissional);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Profissional $profissional)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Profissional $profissional)
    {
        $validated = $request->validate([
            'estabelecimento_id' => ['sometimes', 'exists:estabelecimentos,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);
        $this->authorizeProfissional($request, $profissional);
        if (isset($validated['estabelecimento_id'])) {
            $this->authorizeEstabelecimento($request, (int) $validated['estabelecimento_id']);
        }
        $profissional->update($validated);
        return response()->json($profissional);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Profissional $profissional)
    {
        $this->authorizeProfissional(request(), $profissional);
        $profissional->delete();
        return response()->json(['message' => 'Profissional removido com sucesso.']);
    }

    private function authorizeProfissional(Request $request, Profissional $profissional): void
    {
        if ($request->user()?->role === 'gestor') {
            return;
        }

        $profissional->loadMissing('estabelecimento:id,empresa_id');

        if ($request->user()?->role === 'admin' && (int) $profissional->estabelecimento?->empresa_id === (int) $request->user()->empresa_id) {
            return;
        }

        abort(403, 'Você não tem acesso a este profissional.');
    }

    private function authorizeEstabelecimento(Request $request, int $estabelecimentoId): void
    {
        if ($request->user()?->role === 'gestor') {
            return;
        }

        $exists = \App\Models\Estabelecimento::query()
            ->whereKey($estabelecimentoId)
            ->where('empresa_id', $request->user()?->empresa_id)
            ->exists();

        if (! $exists) {
            abort(403, 'Você não pode usar este local.');
        }
    }
}
