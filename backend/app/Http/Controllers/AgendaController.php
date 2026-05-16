<?php

namespace App\Http\Controllers;

use App\Models\Agenda;
use App\Models\Profissional;
use App\Models\Servico;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AgendaController extends Controller
{
    private function scopedQuery(Request $request)
    {
        $query = Agenda::query()
            ->with([
                'profissional:id,nome,estabelecimento_id',
                'profissional.estabelecimento:id,empresa_id,nome',
                'servico:id,nome,estabelecimento_id,preco',
            ])
            ->whereDate('data', '>=', now()->toDateString())
            ->orderBy('data')
            ->orderBy('hora_inicio');

        if ($request->user()?->role === 'admin') {
            $query->whereHas('profissional.estabelecimento', fn ($estabelecimento) => $estabelecimento->where('empresa_id', $request->user()->empresa_id));
        }

        return $query;
    }

    private function appendAvailability(Agenda|Collection $agendas): Agenda|Collection
    {
        if ($agendas instanceof Collection) {
            return $agendas->map(fn (Agenda $agenda) => $this->appendAvailability($agenda))->filter();
        }

        if (!$agendas) {
            return $agendas;
        }

        try {
            $horarios = $agendas->horariosDisponiveis();
            $agendas->setAttribute('horarios_disponiveis', $horarios);
            $agendas->setAttribute('quantidade_horarios_disponiveis', count($horarios));
        } catch (\Exception $e) {
            $agendas->setAttribute('horarios_disponiveis', []);
            $agendas->setAttribute('quantidade_horarios_disponiveis', 0);
        }

        return $agendas;
    }

    /**
     * Retorna os horários disponíveis (slots)
     */
    public function horarios(Agenda $agenda)
    {
        return response()->json($agenda->horariosDisponiveis());
    }

    private function normalizeIntervalos(array $validated, ?Agenda $agenda = null): array
    {
        $intervalos = $validated['intervalos'] ?? $agenda?->intervalos ?? [];

        if (empty($intervalos)) {
            $horaInicio = $validated['hora_inicio'] ?? $agenda?->hora_inicio;
            $horaFim = $validated['hora_fim'] ?? $agenda?->hora_fim;

            if ($horaInicio && $horaFim) {
                $intervalos = [['hora_inicio' => $horaInicio, 'hora_fim' => $horaFim]];
            }
        }

        if (empty($intervalos)) {
            throw ValidationException::withMessages([
                'intervalos' => ['Informe pelo menos um intervalo de atendimento.'],
            ]);
        }

        foreach ($intervalos as $intervalo) {
            if ($intervalo['hora_fim'] <= $intervalo['hora_inicio']) {
                throw ValidationException::withMessages([
                    'intervalos' => ['A hora final deve ser maior que a inicial em cada intervalo.'],
                ]);
            }
        }

        usort($intervalos, fn ($a, $b) => strcmp($a['hora_inicio'], $b['hora_inicio']));

        return array_values($intervalos);
    }

    private function fillLegacyTimeColumns(array &$validated, array $intervalos): void
    {
        $validated['hora_inicio'] = min(array_column($intervalos, 'hora_inicio'));
        $validated['hora_fim'] = max(array_column($intervalos, 'hora_fim'));
        $validated['intervalos'] = $intervalos;
    }

    /**
     * Lista agendas
     */
    public function index(Request $request)
    {
        $query = $this->scopedQuery($request);

        if ($request->filled('data')) {
            $query->whereDate('data', $request->input('data'));
        }

        if ($request->filled('profissional_id')) {
            $query->where('profissional_id', $request->input('profissional_id'));
        }

        if ($request->filled('servico_id')) {
            $query->where('servico_id', $request->input('servico_id'));
        }

        if ($request->filled('estabelecimento_id')) {
            $query->whereHas('profissional', function ($q) use ($request) {
                $q->where('estabelecimento_id', $request->input('estabelecimento_id'));
            });
        }

        $agendas = $this->appendAvailability($query->get());

        if (! $request->bearerToken()) {
            $agendas = $agendas->filter(
                fn (Agenda $agenda) => $agenda->getAttribute('quantidade_horarios_disponiveis') > 0
            )->values();
        }

        return response()->json($agendas);
    }

    public function publicIndex(Request $request)
    {
        $query = Agenda::query()
            ->with([
                'profissional:id,nome,estabelecimento_id',
                'servico:id,nome,estabelecimento_id,preco',
            ])
            ->where('status', '!=', 'bloqueada')
            ->whereDate('data', '>=', now()->toDateString())
            ->whereHas('profissional.estabelecimento', fn ($estabelecimento) => $estabelecimento->comAtendimentoAtivo())
            ->orderBy('data')
            ->orderBy('hora_inicio');

        if ($request->filled('data')) {
            $query->whereDate('data', $request->input('data'));
        }

        if ($request->filled('profissional_id')) {
            $query->where('profissional_id', $request->input('profissional_id'));
        }

        if ($request->filled('servico_id')) {
            $query->where('servico_id', $request->input('servico_id'));
        }

        if ($request->filled('estabelecimento_id')) {
            $query->whereHas('profissional', function ($q) use ($request) {
                $q->where('estabelecimento_id', $request->input('estabelecimento_id'));
            });
        }

        $agendas = $this->appendAvailability($query->get())
            ->filter(fn (Agenda $agenda) => $agenda->getAttribute('quantidade_horarios_disponiveis') > 0)
            ->values();

        return response()->json($agendas);
    }

    /**
     * Criar agenda
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'profissional_id' => ['required', 'exists:profissionais,id'],
            'servico_id' => ['required', 'exists:servicos,id'],
            'data' => ['required', 'date', 'after_or_equal:today'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'hora_fim' => ['nullable', 'date_format:H:i'],
            'intervalo_minutos' => ['required', 'integer', 'min:1', 'max:180'],
            'intervalos' => ['nullable', 'array'],
            'intervalos.*.hora_inicio' => ['required_with:intervalos', 'date_format:H:i'],
            'intervalos.*.hora_fim' => ['required_with:intervalos', 'date_format:H:i'],
            'status' => ['nullable', 'in:disponivel,bloqueada,ocupada'],
        ]);

        $profissional = Profissional::findOrFail($validated['profissional_id']);
        $servico = Servico::findOrFail($validated['servico_id']);
        $this->authorizeEmpresaAccess($request, $profissional->estabelecimento_id);

        // 🔥 valida estabelecimento
        if ($profissional->estabelecimento_id !== $servico->estabelecimento_id) {
            throw ValidationException::withMessages([
                'servico_id' => ['O serviço deve pertencer ao mesmo estabelecimento do profissional.'],
            ]);
        }

        $intervalos = $this->normalizeIntervalos($validated);

        // 🔥 evita conflito de agenda para mesmo profissional/serviço no dia
        $conflito = Agenda::where('profissional_id', $validated['profissional_id'])
            ->where('servico_id', $validated['servico_id'])
            ->whereDate('data', $validated['data'])
            ->where('id', '!=', $request->route('agenda')?->id ?? null) // Para update
            ->where(function ($q) use ($intervalos) {
                foreach ($intervalos as $intervalo) {
                    $q->orWhere(function ($subQ) use ($intervalo) {
                        $subQ->whereBetween('hora_inicio', [$intervalo['hora_inicio'], $intervalo['hora_fim']])
                             ->orWhereBetween('hora_fim', [$intervalo['hora_inicio'], $intervalo['hora_fim']])
                             ->orWhere(function ($innerQ) use ($intervalo) {
                                 $innerQ->where('hora_inicio', '<=', $intervalo['hora_inicio'])
                                        ->where('hora_fim', '>=', $intervalo['hora_fim']);
                             });
                    });
                }
            })
            ->exists();

        if ($conflito) {
            throw ValidationException::withMessages([
                'intervalos' => ['Já existe uma agenda conflitante para este profissional/serviço neste dia.'],
            ]);
        }

        $this->fillLegacyTimeColumns($validated, $intervalos);

        $agenda = Agenda::create($validated);
        $agenda->sincronizarStatusDisponibilidade();

        return response()->json(
            $this->appendAvailability($agenda->load([
                'profissional:id,nome,estabelecimento_id',
                'servico:id,nome,estabelecimento_id,preco',
            ])),
            201
        );
    }

    /**
     * Exibir agenda
     */
    public function show(Agenda $agenda)
    {
        $this->authorizeAgendaAccess(request(), $agenda);

        return response()->json(
            $this->appendAvailability($agenda->load([
                'profissional:id,nome,estabelecimento_id',
                'servico:id,nome,estabelecimento_id,preco',
            ]))
        );
    }

    /**
     * Atualizar agenda
     */
    public function update(Request $request, Agenda $agenda)
    {
        $validated = $request->validate([
            'profissional_id' => ['sometimes', 'exists:profissionais,id'],
            'servico_id' => ['sometimes', 'exists:servicos,id'],
            'data' => ['sometimes', 'date', 'after_or_equal:today'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'hora_fim' => ['nullable', 'date_format:H:i'],
            'intervalo_minutos' => ['sometimes', 'integer', 'min:1', 'max:180'],
            'intervalos' => ['nullable', 'array'],
            'intervalos.*.hora_inicio' => ['required_with:intervalos', 'date_format:H:i'],
            'intervalos.*.hora_fim' => ['required_with:intervalos', 'date_format:H:i'],
            'status' => ['nullable', 'in:disponivel,bloqueada,ocupada'],
        ]);

        $profissionalId = $validated['profissional_id'] ?? $agenda->profissional_id;
        $servicoId = $validated['servico_id'] ?? $agenda->servico_id;
        $data = $validated['data'] ?? $agenda->data;

        // valida relacionamento
        if ($servicoId) {
            $profissional = Profissional::findOrFail($profissionalId);
            $servico = Servico::findOrFail($servicoId);
            $this->authorizeEmpresaAccess($request, $profissional->estabelecimento_id);

            if ($profissional->estabelecimento_id !== $servico->estabelecimento_id) {
                throw ValidationException::withMessages([
                    'servico_id' => ['O serviço deve pertencer ao mesmo estabelecimento.'],
                ]);
            }
        }

        $intervalos = $this->normalizeIntervalos($validated, $agenda);

        // evita conflito de agenda
        $conflito = Agenda::where('profissional_id', $profissionalId)
            ->where('servico_id', $servicoId)
            ->whereDate('data', $data)
            ->where('id', '!=', $agenda->id)
            ->where(function ($q) use ($intervalos) {
                foreach ($intervalos as $intervalo) {
                    $q->orWhere(function ($subQ) use ($intervalo) {
                        $subQ->whereBetween('hora_inicio', [$intervalo['hora_inicio'], $intervalo['hora_fim']])
                             ->orWhereBetween('hora_fim', [$intervalo['hora_inicio'], $intervalo['hora_fim']])
                             ->orWhere(function ($innerQ) use ($intervalo) {
                                 $innerQ->where('hora_inicio', '<=', $intervalo['hora_inicio'])
                                        ->where('hora_fim', '>=', $intervalo['hora_fim']);
                             });
                    });
                }
            })
            ->exists();

        if ($conflito) {
            throw ValidationException::withMessages([
                'intervalos' => ['Já existe uma agenda conflitante para este profissional/serviço neste dia.'],
            ]);
        }

        $this->fillLegacyTimeColumns($validated, $intervalos);

        $agenda->update($validated);
        $agenda->refresh();
        $agenda->sincronizarStatusDisponibilidade();

        return response()->json(
            $this->appendAvailability($agenda->load([
                'profissional:id,nome,estabelecimento_id',
                'servico:id,nome,estabelecimento_id,preco',
            ]))
        );
    }

    /**
     * Deletar agenda
     */
    public function destroy(Agenda $agenda)
    {
        $this->authorizeAgendaAccess(request(), $agenda);
        $agenda->delete();

        return response()->json([
            'message' => 'Agenda removida com sucesso.'
        ]);
    }

    private function authorizeAgendaAccess(Request $request, Agenda $agenda): void
    {
        if ($request->user()?->role === 'gestor') {
            return;
        }

        $agenda->loadMissing('profissional.estabelecimento:id,empresa_id');

        if ($request->user()?->role === 'admin' && (int) $agenda->profissional?->estabelecimento?->empresa_id === (int) $request->user()->empresa_id) {
            return;
        }

        abort(403, 'Você não tem acesso a esta agenda.');
    }

    private function authorizeEmpresaAccess(Request $request, int $estabelecimentoId): void
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
