<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agenda extends Model
{
    protected $fillable = [
        'profissional_id', 'servico_id', 'data', 'hora_inicio', 'hora_fim', 'intervalo_minutos', 'intervalos', 'status'
    ];

    protected $casts = [
        'data' => 'date:Y-m-d',
        'intervalos' => 'array',
    ];

    public function profissional(): BelongsTo
    {
        return $this->belongsTo(Profissional::class);
    }

    public function servico(): BelongsTo
    {
        return $this->belongsTo(Servico::class);
    }

    public function agendamentos(): HasMany
    {
        return $this->hasMany(Agendamento::class);
    }

    public function horariosGerados(): array
    {
        $horarios = [];

        if ($this->intervalos && count($this->intervalos) > 0) {
            foreach ($this->intervalos as $intervalo) {
                $horarios = array_merge(
                    $horarios,
                    $this->buildSlotsFromWindow($intervalo['hora_inicio'] ?? null, $intervalo['hora_fim'] ?? null)
                );
            }
        } else {
            $horarios = $this->buildSlotsFromWindow($this->hora_inicio, $this->hora_fim);
        }

        $horarios = array_values(array_unique(array_filter($horarios)));
        sort($horarios);

        return $horarios;
    }

    public function horariosReservados(): array
    {
        return $this->agendamentos()
            ->where('status', '!=', 'cancelado')
            ->pluck('horario')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();
    }

    public function horariosDisponiveis(): array
    {
        return array_values(array_diff($this->horariosGerados(), $this->horariosReservados()));
    }

    public function sincronizarStatusDisponibilidade(): void
    {
        if ($this->status === 'bloqueada') {
            return;
        }

        $novoStatus = count($this->horariosDisponiveis()) > 0 ? 'disponivel' : 'ocupada';

        if ($this->status !== $novoStatus) {
            $this->update(['status' => $novoStatus]);
        }
    }

    private function buildSlotsFromWindow(?string $horaInicio, ?string $horaFim): array
    {
        if (! $horaInicio || ! $horaFim || ! $this->intervalo_minutos) {
            return [];
        }

        $inicio = Carbon::parse($horaInicio);
        $fim = Carbon::parse($horaFim);
        $slots = [];

        while ($inicio->copy()->addMinutes($this->intervalo_minutos)->lte($fim)) {
            $slots[] = $inicio->format('H:i');
            $inicio->addMinutes($this->intervalo_minutos);
        }

        return $slots;
    }
}
