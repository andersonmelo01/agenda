<?php

namespace App\Http\Controllers;

use App\Mail\BookingCancellationMail;
use App\Mail\BookingConfirmationMail;
use App\Models\Agenda;
use App\Models\Agendamento;
use App\Models\User;
use App\Support\MailConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AgendamentoController extends Controller
{
    private function relations(): array
    {
        return [
            'agenda.profissional.estabelecimento:id,nome,slug,status,data_validade,email,telefone_contato,whatsapp,cep,logradouro,numero,complemento,bairro,cidade,estado',
            'agenda.servico:id,nome,preco,estabelecimento_id',
            'usuario:id,name,email,role',
        ];
    }

    private function loadAgendamento(Agendamento $agendamento): Agendamento
    {
        return $agendamento->load($this->relations());
    }

    private function ensureOwnershipOrAdmin(Request $request, Agendamento $agendamento): void
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if ($user->role === 'admin') {
            $agendamento->loadMissing('agenda.profissional.estabelecimento:id,empresa_id');

            if ((int) $agendamento->agenda?->profissional?->estabelecimento?->empresa_id !== (int) $user->empresa_id) {
                abort(403, 'Você não pode alterar este agendamento.');
            }

            return;
        }

        if ($user->role === 'gestor') {
            return;
        }

        if ((int) $agendamento->usuario_id !== (int) $user->id) {
            abort(403, 'Você não pode alterar este agendamento.');
        }
    }

    private function sendConfirmationMail(Agendamento $agendamento): void
    {
        if (! $agendamento->email_cliente) {
            return;
        }

        // Carregar relacionamentos necessários para o template de e-mail
        $agendamento->load([
            'agenda.profissional.estabelecimento:id,nome,status,data_validade,email,telefone_contato,whatsapp,cep,logradouro,numero,complemento,bairro,cidade,estado',
            'agenda.servico:id,nome,preco,estabelecimento_id'
        ]);

        MailConfiguration::apply();
        Mail::to($agendamento->email_cliente)->send(new BookingConfirmationMail($agendamento));
    }

    private function sendCancellationMail(Agendamento $agendamento): void
    {
        if (! $agendamento->email_cliente) {
            return;
        }

        // Carregar relacionamentos necessários para o template de e-mail
        $agendamento->load([
            'agenda.profissional.estabelecimento:id,nome,status,data_validade,email,telefone_contato,whatsapp,cep,logradouro,numero,complemento,bairro,cidade,estado',
            'agenda.servico:id,nome,preco,estabelecimento_id'
        ]);

        MailConfiguration::apply();
        Mail::to($agendamento->email_cliente)->send(new BookingCancellationMail($agendamento));
    }

    private function validateAgendaSlot(Agenda $agenda, string $horario, ?int $ignoreAgendamentoId = null): void
    {
        if ($agenda->status === 'bloqueada') {
            throw ValidationException::withMessages([
                'agenda_id' => ['A agenda selecionada está bloqueada.'],
            ]);
        }

        if (! in_array($horario, $agenda->horariosGerados(), true)) {
            throw ValidationException::withMessages([
                'horario' => ['O horário informado não pertence à agenda selecionada.'],
            ]);
        }

        $slotOcupado = $agenda->agendamentos()
            ->where('status', '!=', 'cancelado')
            ->when($ignoreAgendamentoId, fn ($query) => $query->where('id', '!=', $ignoreAgendamentoId))
            ->where('horario', $horario)
            ->exists();

        if ($slotOcupado) {
            throw ValidationException::withMessages([
                'horario' => ['Este horário já foi reservado por outro cliente.'],
            ]);
        }
    }

    public function index(Request $request)
    {
        $query = Agendamento::query()
            ->with($this->relations())
            ->orderByDesc('created_at');

        if ($request->user()?->role === 'admin') {
            $query->whereHas('agenda.profissional.estabelecimento', fn ($estabelecimento) => $estabelecimento->where('empresa_id', $request->user()->empresa_id));
        }

        if ($request->filled('data')) {
            $query->whereHas('agenda', function ($agendaQuery) use ($request) {
                $agendaQuery->whereDate('data', $request->input('data'));
            });
        }

        if ($request->filled('profissional_id')) {
            $query->whereHas('agenda', function ($agendaQuery) use ($request) {
                $agendaQuery->where('profissional_id', $request->input('profissional_id'));
            });
        }

        if ($request->filled('servico_id')) {
            $query->whereHas('agenda', function ($agendaQuery) use ($request) {
                $agendaQuery->where('servico_id', $request->input('servico_id'));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->get());
    }

    public function mine(Request $request)
    {
        return response()->json(
            Agendamento::query()
                ->with($this->relations())
                ->where('usuario_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'agenda_id' => ['required', 'exists:agendas,id'],
            'horario' => ['required', 'date_format:H:i'],
            'usuario_id' => ['nullable', 'exists:users,id'],
            'email_cliente' => ['nullable', 'email', 'max:255'],
            'estabelecimento_slug' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:pendente,confirmado,cancelado,concluido'],
        ]);

        $user = $request->user();

        $agendamento = DB::transaction(function () use ($validated, $user) {
            $agenda = Agenda::query()
                ->with([
                    'profissional.estabelecimento:id,nome,empresa_id,slug,status,data_validade',
                    'profissional.estabelecimento.empresa:id,nome,status,limite_locais,data_validade',
                    'servico:id,nome,preco,estabelecimento_id',
                ])
                ->whereKey($validated['agenda_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($user?->role === 'admin' && (int) $agenda->profissional?->estabelecimento?->empresa_id !== (int) $user->empresa_id) {
                abort(403, 'Você não pode usar esta agenda.');
            }

            if (
                $agenda->profissional?->estabelecimento?->empresa?->licenca_bloqueada
                || $agenda->profissional?->estabelecimento?->atendimento_bloqueado
            ) {
                throw ValidationException::withMessages([
                    'agenda_id' => [$agenda->profissional?->estabelecimento?->atendimento_mensagem ?: 'Este estabelecimento está temporariamente indisponível para agendamentos.'],
                ]);
            }

            if (! in_array($user?->role, ['admin', 'gestor'], true)) {
                $estabelecimentoSlug = $validated['estabelecimento_slug'] ?? null;
                $agendaSlug = $agenda->profissional?->estabelecimento?->slug;

                if (! $estabelecimentoSlug || $estabelecimentoSlug !== $agendaSlug) {
                    throw ValidationException::withMessages([
                        'estabelecimento_slug' => ['Para agendar, acesse o link exclusivo do estabelecimento.'],
                    ]);
                }
            }

            $this->validateAgendaSlot($agenda, $validated['horario']);

            $usuarioId = ($user?->role === 'admin' && filled($validated['usuario_id'] ?? null))
                ? $validated['usuario_id']
                : $user?->id;

            $emailCliente = $validated['email_cliente'] ?? null;

            if (! $emailCliente && $usuarioId) {
                $emailCliente = User::query()->whereKey($usuarioId)->value('email') ?: $user?->email;
            }

            $agendamento = Agendamento::create([
                'agenda_id' => $agenda->id,
                'horario' => $validated['horario'],
                'usuario_id' => $usuarioId,
                'email_cliente' => $emailCliente,
                'status' => $validated['status'] ?? 'confirmado',
            ]);

            $agenda->sincronizarStatusDisponibilidade();

            return $this->loadAgendamento($agendamento);
        });

        if ($agendamento->status !== 'cancelado') {
            $this->sendConfirmationMail($agendamento);
        }

        return response()->json($agendamento, 201);
    }

    public function show(Agendamento $agendamento)
    {
        $this->ensureOwnershipOrAdmin(request(), $agendamento);
        return response()->json($this->loadAgendamento($agendamento));
    }

    public function update(Request $request, Agendamento $agendamento)
    {
        $this->ensureOwnershipOrAdmin($request, $agendamento);

        $validated = $request->validate([
            'agenda_id' => ['sometimes', 'exists:agendas,id'],
            'horario' => ['sometimes', 'date_format:H:i'],
            'usuario_id' => ['nullable', 'exists:users,id'],
            'email_cliente' => ['sometimes', 'nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'in:pendente,confirmado,cancelado,concluido'],
        ]);

        $originalAgendaId = $agendamento->agenda_id;
        $originalStatus = $agendamento->status;

        $updated = DB::transaction(function () use ($agendamento, $validated, $originalAgendaId) {
            $currentAgenda = Agenda::query()
                ->whereKey($originalAgendaId)
                ->lockForUpdate()
                ->first();

            $targetAgendaId = $validated['agenda_id'] ?? $agendamento->agenda_id;
            $targetHorario = $validated['horario'] ?? $agendamento->horario;
            $targetStatus = $validated['status'] ?? $agendamento->status;

            $targetAgenda = Agenda::query()
                ->with(['profissional.estabelecimento:id,nome,empresa_id', 'servico:id,nome,preco,estabelecimento_id'])
                ->whereKey($targetAgendaId)
                ->lockForUpdate()
                ->firstOrFail();

            if (request()->user()?->role === 'admin') {
                $targetAgenda->loadMissing('profissional.estabelecimento:id,empresa_id');
                if ((int) $targetAgenda->profissional?->estabelecimento?->empresa_id !== (int) request()->user()->empresa_id) {
                    abort(403, 'Você não pode usar esta agenda.');
                }
            }

            if ($targetStatus !== 'cancelado') {
                $this->validateAgendaSlot($targetAgenda, $targetHorario, $agendamento->id);
            }

            $agendamento->update($validated);

            if ($currentAgenda) {
                $currentAgenda->refresh();
                $currentAgenda->sincronizarStatusDisponibilidade();
            }

            if (! $currentAgenda || (int) $currentAgenda->id !== (int) $targetAgenda->id) {
                $targetAgenda->refresh();
            }
            $targetAgenda->sincronizarStatusDisponibilidade();

            return $this->loadAgendamento($agendamento);
        });

        if ($originalStatus !== 'cancelado' && $updated->status === 'cancelado') {
            $this->sendCancellationMail($updated);
        }

        if ($originalStatus === 'cancelado' && $updated->status !== 'cancelado') {
            $this->sendConfirmationMail($updated);
        }

        if ((int) $updated->agenda_id !== (int) $originalAgendaId && $updated->status !== 'cancelado') {
            $this->sendConfirmationMail($updated);
        }

        return response()->json($updated);
    }

    public function cancelMine(Request $request, Agendamento $agendamento)
    {
        $this->ensureOwnershipOrAdmin($request, $agendamento);
        $originalStatus = $agendamento->status;

        $cancelled = DB::transaction(function () use ($agendamento) {
            $agendamento->loadMissing($this->relations());

            $agenda = Agenda::query()
                ->whereKey($agendamento->agenda_id)
                ->lockForUpdate()
                ->first();

            if ($agendamento->status !== 'cancelado') {
                $agendamento->update(['status' => 'cancelado']);
            }

            if ($agenda) {
                $agenda->sincronizarStatusDisponibilidade();
            }

            return $this->loadAgendamento($agendamento);
        });

        if ($originalStatus !== 'cancelado' && $cancelled->status === 'cancelado') {
            $this->sendCancellationMail($cancelled);
        }

        return response()->json($cancelled);
    }

    public function destroy(Agendamento $agendamento)
    {
        $this->ensureOwnershipOrAdmin(request(), $agendamento);
        $originalStatus = $agendamento->status;

        $cancelled = DB::transaction(function () use ($agendamento) {
            $agendamento->loadMissing($this->relations());

            $agenda = Agenda::query()
                ->whereKey($agendamento->agenda_id)
                ->lockForUpdate()
                ->first();

            if ($agendamento->status !== 'cancelado') {
                $agendamento->update(['status' => 'cancelado']);
            }

            if ($agenda) {
                $agenda->sincronizarStatusDisponibilidade();
            }

            return $this->loadAgendamento($agendamento);
        });

        if ($originalStatus !== 'cancelado' && $cancelled->status === 'cancelado') {
            $this->sendCancellationMail($cancelled);
        }

        return response()->json(['message' => 'Agendamento cancelado com sucesso.']);
    }
}
