<?php

namespace App\Http\Controllers;

use App\Models\Servico;
use Illuminate\Http\Request;

class ServicoController extends Controller
{
    private function scopedQuery(Request $request)
    {
        $query = Servico::query()
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
        $query = Servico::query()
            ->with('estabelecimento:id,empresa_id,nome')
            ->whereHas('estabelecimento', fn ($estabelecimento) => $estabelecimento->comAtendimentoAtivo())
            ->select(['id', 'estabelecimento_id', 'nome', 'descricao', 'preco'])
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
            'descricao' => ['nullable', 'string'],
            'preco' => ['nullable', 'numeric', 'min:0'],
        ]);
        $this->authorizeEstabelecimento($request, (int) $validated['estabelecimento_id']);
        $servico = Servico::create($validated);
        return response()->json($servico, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Servico $servico)
    {
        $this->authorizeServico(request(), $servico);
        return response()->json($servico);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Servico $servico)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Servico $servico)
    {
        $validated = $request->validate([
            'estabelecimento_id' => ['sometimes', 'exists:estabelecimentos,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'preco' => ['nullable', 'numeric', 'min:0'],
        ]);
        $this->authorizeServico($request, $servico);
        if (isset($validated['estabelecimento_id'])) {
            $this->authorizeEstabelecimento($request, (int) $validated['estabelecimento_id']);
        }
        $servico->update($validated);
        return response()->json($servico);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Servico $servico)
    {
        $this->authorizeServico(request(), $servico);
        $servico->delete();
        return response()->json(['message' => 'Serviço removido com sucesso.']);
    }

    private function authorizeServico(Request $request, Servico $servico): void
    {
        if ($request->user()?->role === 'gestor') {
            return;
        }

        $servico->loadMissing('estabelecimento:id,empresa_id');

        if ($request->user()?->role === 'admin' && (int) $servico->estabelecimento?->empresa_id === (int) $request->user()->empresa_id) {
            return;
        }

        abort(403, 'Você não tem acesso a este serviço.');
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
