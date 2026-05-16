<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Plano;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmpresaController extends Controller
{
    public function index()
    {
        return response()->json(
            Empresa::query()
                ->with('plano:id,nome,codigo,preco_base,preco_por_local')
                ->withCount('estabelecimentos')
                ->orderBy('nome')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validateEmpresa($request);
        $validated = $this->applyPlanRules($validated);

        return response()->json(
            Empresa::create($validated)->load('plano:id,nome,codigo'),
            201
        );
    }

    public function show(Empresa $empresa)
    {
        return response()->json(
            $empresa->load('plano:id,nome,codigo,preco_base,preco_por_local')->loadCount('estabelecimentos')
        );
    }

    public function update(Request $request, Empresa $empresa)
    {
        $validated = $this->validateEmpresa($request, partial: true);
        $validated = $this->applyPlanRules($validated, $empresa);

        if (array_key_exists('limite_locais', $validated)) {
            $locaisAtuais = $empresa->estabelecimentos()->count();

            if ((int) $validated['limite_locais'] < $locaisAtuais) {
                throw ValidationException::withMessages([
                    'limite_locais' => ["A empresa já possui {$locaisAtuais} local(is) cadastrado(s)."],
                ]);
            }
        }

        $empresa->update($validated);

        return response()->json(
            $empresa->refresh()->load('plano:id,nome,codigo,preco_base,preco_por_local')->loadCount('estabelecimentos')
        );
    }

    public function destroy(Empresa $empresa)
    {
        if ($empresa->estabelecimentos()->exists()) {
            abort(422, 'Remova os locais desta empresa antes de excluí-la.');
        }

        $empresa->delete();

        return response()->json(['message' => 'Empresa removida com sucesso.']);
    }

    private function validateEmpresa(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'plano_id' => [$required, 'exists:planos,id'],
            'nome' => [$required, 'string', 'max:255'],
            'documento' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'status' => ['sometimes', 'in:ativo,suspenso,cancelado'],
            'limite_locais' => ['nullable', 'integer', 'min:1'],
            'valor_mensal' => ['nullable', 'numeric', 'min:0'],
            'data_validade' => ['nullable', 'date'],
        ]);
    }

    private function applyPlanRules(array $validated, ?Empresa $empresa = null): array
    {
        $planoId = $validated['plano_id'] ?? $empresa?->plano_id;

        if (! $planoId) {
            return $validated;
        }

        $plano = Plano::findOrFail($planoId);

        if ($plano->isStart()) {
            $validated['limite_locais'] = 1;
        } elseif ($plano->codigo === 'pro') {
            $validated['limite_locais'] = (int) ($validated['limite_locais'] ?? $empresa?->limite_locais ?? 1);
        } else {
            $validated['limite_locais'] = (int) ($validated['limite_locais'] ?? $plano->limite_locais ?? $empresa?->limite_locais ?? 1);
        }

        if (! array_key_exists('valor_mensal', $validated) || $validated['valor_mensal'] === null || $validated['valor_mensal'] === '') {
            $validated['valor_mensal'] = (float) $plano->preco_base + ((float) $plano->preco_por_local * (int) $validated['limite_locais']);
        }

        $validated['status'] = $validated['status'] ?? $empresa?->status ?? 'ativo';

        return $validated;
    }
}
