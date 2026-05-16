<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Estabelecimento;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EstabelecimentoController extends Controller
{
    private function baseQuery(Request $request)
    {
        $query = Estabelecimento::query()
            ->with('empresa:id,nome,plano_id,limite_locais,status,data_validade')
            ->orderBy('nome');

        $user = $request->user();

        if ($user?->role === 'admin') {
            $query->where('empresa_id', $user->empresa_id);
        }

        return $query;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = $this->baseQuery($request);

        return response()->json($query->get([
            'id',
            'empresa_id',
            'slug',
            'nome',
            'segmento',
            'status',
            'data_validade',
            'email',
            'telefone_contato',
            'whatsapp',
            'cep',
            'logradouro',
            'numero',
            'complemento',
            'bairro',
            'cidade',
            'estado',
        ]));
    }

    public function publicIndex(Request $request)
    {
        $query = Estabelecimento::query()
            ->comAtendimentoAtivo()
            ->orderBy('nome');

        $query->select([
            'id',
            'empresa_id',
            'slug',
            'nome',
            'segmento',
            'status',
            'data_validade',
            'email',
            'telefone_contato',
            'whatsapp',
            'cep',
            'logradouro',
            'numero',
            'complemento',
            'bairro',
            'cidade',
            'estado',
        ]);

        return response()->json($query->get());
    }

    public function publicShow(string $slug)
    {
        $estabelecimento = Estabelecimento::query()
            ->with('empresa:id,nome,status,limite_locais,data_validade')
            ->where('slug', $slug)
            ->firstOrFail([
                'id',
                'empresa_id',
                'slug',
                'nome',
                'segmento',
                'status',
                'data_validade',
                'email',
                'telefone_contato',
                'whatsapp',
                'cep',
                'logradouro',
                'numero',
                'complemento',
                'bairro',
                'cidade',
                'estado',
            ]);

        if (! $estabelecimento->empresa || $estabelecimento->empresa->licenca_bloqueada || $estabelecimento->atendimento_bloqueado) {
            abort(403, $estabelecimento->atendimento_mensagem ?: 'Este estabelecimento está temporariamente indisponível para agendamentos.');
        }

        return response()->json($estabelecimento);
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
            'empresa_id' => [$request->user()?->role === 'gestor' ? 'required' : 'nullable', 'exists:empresas,id'],
            'nome' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:120', 'unique:estabelecimentos,slug'],
            'segmento' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'in:ativo,inativo,suspenso'],
            'data_validade' => ['required', 'date'],
            'email' => ['required', 'email', 'max:255', 'unique:estabelecimentos,email', 'unique:users,email'],
            'senha' => ['required', 'string', 'min:6'],
            'telefone_contato' => ['required', 'string', 'max:20'],
            'whatsapp' => ['required', 'string', 'max:20'],
            'cep' => ['required', 'string', 'max:9'],
            'logradouro' => ['required', 'string', 'max:255'],
            'numero' => ['required', 'string', 'max:30'],
            'complemento' => ['nullable', 'string', 'max:120'],
            'bairro' => ['required', 'string', 'max:120'],
            'cidade' => ['required', 'string', 'max:120'],
            'estado' => ['required', 'string', 'size:2'],
        ]);

        $validated['empresa_id'] = $this->resolveEmpresaId($request, $validated['empresa_id'] ?? null);
        $validated['slug'] = $this->makeUniqueSlug($validated['slug'] ?? $validated['nome']);
        $validated['status'] = $validated['status'] ?? 'ativo';
        $this->ensureEmpresaCanReceiveLocal($validated['empresa_id']);

        $validated['senha'] = Hash::make($validated['senha']);
        $estabelecimento = Estabelecimento::create($validated);
        $this->syncAdminUser($estabelecimento, $request->input('senha'));

        return response()->json($estabelecimento->load('empresa:id,nome,plano_id,limite_locais,status,data_validade'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Estabelecimento $estabelecimento)
    {
        $this->authorizeEmpresaAccess(request(), $estabelecimento);

        return response()->json($estabelecimento->load('empresa:id,nome,plano_id,limite_locais,status,data_validade'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Estabelecimento $estabelecimento)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Estabelecimento $estabelecimento)
    {
        $this->authorizeEmpresaAccess($request, $estabelecimento);
        $oldEmail = $estabelecimento->email;

        $validated = $request->validate([
            'empresa_id' => [$request->user()?->role === 'gestor' ? 'sometimes' : 'nullable', 'exists:empresas,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:120', Rule::unique('estabelecimentos', 'slug')->ignore($estabelecimento->id)],
            'segmento' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:ativo,inativo,suspenso'],
            'data_validade' => ['sometimes', 'date'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('estabelecimentos', 'email')->ignore($estabelecimento->id),
                Rule::unique('users', 'email')->ignore(User::where('email', $estabelecimento->email)->value('id')),
            ],
            'senha' => ['sometimes', 'nullable', 'string', 'min:6'],
            'telefone_contato' => ['sometimes', 'string', 'max:20'],
            'whatsapp' => ['sometimes', 'string', 'max:20'],
            'cep' => ['sometimes', 'string', 'max:9'],
            'logradouro' => ['sometimes', 'string', 'max:255'],
            'numero' => ['sometimes', 'string', 'max:30'],
            'complemento' => ['sometimes', 'nullable', 'string', 'max:120'],
            'bairro' => ['sometimes', 'string', 'max:120'],
            'cidade' => ['sometimes', 'string', 'max:120'],
            'estado' => ['sometimes', 'string', 'size:2'],
        ]);

        if ($request->user()?->role !== 'gestor') {
            unset($validated['empresa_id']);
        }

        if (array_key_exists('slug', $validated)) {
            $validated['slug'] = $this->makeUniqueSlug($validated['slug'] ?: ($validated['nome'] ?? $estabelecimento->nome), $estabelecimento->id);
        }

        if (array_key_exists('empresa_id', $validated) && (int) $validated['empresa_id'] !== (int) $estabelecimento->empresa_id) {
            $this->ensureEmpresaCanReceiveLocal($validated['empresa_id']);
        }

        $plainPassword = filled($validated['senha'] ?? null) ? $validated['senha'] : null;

        if (array_key_exists('senha', $validated) && filled($validated['senha'])) {
            $validated['senha'] = Hash::make($validated['senha']);
        } else {
            unset($validated['senha']);
        }

        $estabelecimento->update($validated);
        $this->syncAdminUser($estabelecimento->refresh(), $plainPassword, $oldEmail);

        return response()->json($estabelecimento->load('empresa:id,nome,plano_id,limite_locais,status,data_validade'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Estabelecimento $estabelecimento)
    {
        $this->authorizeEmpresaAccess(request(), $estabelecimento);
        $estabelecimento->delete();
        return response()->json(['message' => 'Estabelecimento removido com sucesso.']);
    }

    private function resolveEmpresaId(Request $request, ?int $empresaId): int
    {
        $user = $request->user();

        if ($user?->role === 'gestor') {
            return (int) $empresaId;
        }

        if ($user?->role === 'admin' && $user->empresa_id) {
            return (int) $user->empresa_id;
        }

        abort(403, 'Usuário administrativo sem empresa vinculada.');
    }

    private function ensureEmpresaCanReceiveLocal(int $empresaId): void
    {
        $empresa = Empresa::withCount('estabelecimentos')->findOrFail($empresaId);

        if ($empresa->licenca_bloqueada) {
            throw ValidationException::withMessages([
                'empresa_id' => [$empresa->licenca_mensagem ?: 'A empresa está indisponível.'],
            ]);
        }

        if ($empresa->estabelecimentos_count >= $empresa->limite_locais) {
            throw ValidationException::withMessages([
                'empresa_id' => ["O plano atual permite {$empresa->limite_locais} local(is). Ajuste o plano antes de cadastrar outra filial."],
            ]);
        }
    }

    private function authorizeEmpresaAccess(Request $request, Estabelecimento $estabelecimento): void
    {
        $user = $request->user();

        if ($user?->role === 'gestor') {
            return;
        }

        if ($user?->role === 'admin' && (int) $user->empresa_id === (int) $estabelecimento->empresa_id) {
            return;
        }

        abort(403, 'Você não tem acesso a este local.');
    }

    private function syncAdminUser(Estabelecimento $estabelecimento, ?string $plainPassword = null, ?string $oldEmail = null): void
    {
        $values = [
            'email' => $estabelecimento->email,
            'empresa_id' => $estabelecimento->empresa_id,
            'name' => "Administrador {$estabelecimento->nome}",
            'phone' => $estabelecimento->telefone_contato,
            'role' => 'admin',
            'email_verified_at' => now(),
        ];

        if ($plainPassword) {
            $values['password'] = Hash::make($plainPassword);
        }

        $lookupEmail = $oldEmail ?: $estabelecimento->email;

        if (! User::where('email', $lookupEmail)->exists() && ! $plainPassword) {
            $values['password'] = Hash::make(Str::random(24));
        }

        User::updateOrCreate(
            ['email' => $lookupEmail],
            $values
        );
    }

    private function makeUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: Str::lower(Str::random(8));
        $slug = $base;
        $suffix = 2;

        while (
            Estabelecimento::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
