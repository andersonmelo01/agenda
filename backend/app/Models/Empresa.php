<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    public const LICENCA_AVISO_DIAS = 7;

    protected $fillable = [
        'plano_id',
        'nome',
        'documento',
        'email',
        'telefone',
        'status',
        'limite_locais',
        'valor_mensal',
        'data_validade',
    ];

    protected $appends = [
        'dias_para_vencimento',
        'licenca_vencida',
        'licenca_proxima_vencimento',
        'licenca_bloqueada',
        'licenca_mensagem',
    ];

    protected $casts = [
        'limite_locais' => 'integer',
        'valor_mensal' => 'decimal:2',
        'data_validade' => 'date:Y-m-d',
    ];

    public function plano(): BelongsTo
    {
        return $this->belongsTo(Plano::class);
    }

    public function estabelecimentos(): HasMany
    {
        return $this->hasMany(Estabelecimento::class);
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function locaisDisponiveis(): int
    {
        return max(0, (int) $this->limite_locais - $this->estabelecimentos()->count());
    }

    public function scopeComLicencaAtiva($query)
    {
        return $query
            ->where('status', 'ativo')
            ->where(function ($subQuery) {
                $subQuery
                    ->whereNull('data_validade')
                    ->orWhereDate('data_validade', '>=', now()->toDateString());
            });
    }

    public function getDiasParaVencimentoAttribute(): ?int
    {
        if (! $this->data_validade) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->data_validade->copy()->startOfDay(), false);
    }

    public function getLicencaVencidaAttribute(): bool
    {
        return $this->data_validade
            ? $this->data_validade->copy()->startOfDay()->lt(now()->startOfDay())
            : false;
    }

    public function getLicencaProximaVencimentoAttribute(): bool
    {
        $dias = $this->dias_para_vencimento;

        return $dias !== null && $dias >= 0 && $dias <= self::LICENCA_AVISO_DIAS;
    }

    public function getLicencaBloqueadaAttribute(): bool
    {
        $status = $this->attributes['status'] ?? null;

        return ($status !== null && $status !== 'ativo') || $this->licenca_vencida;
    }

    public function getLicencaMensagemAttribute(): ?string
    {
        $status = $this->attributes['status'] ?? null;

        if ($status !== null && $status !== 'ativo') {
            return 'A empresa está com status ' . $status . '. Entre em contato com o gestor do sistema.';
        }

        if ($this->licenca_vencida) {
            return 'A licença da empresa venceu em ' . $this->data_validade->format('d/m/Y') . '. Entre em contato com o gestor do sistema.';
        }

        if ($this->licenca_proxima_vencimento) {
            $dias = $this->dias_para_vencimento;

            if ($dias === 0) {
                return 'A licença da empresa vence hoje. Renove para evitar bloqueio de acesso e agendamentos.';
            }

            return "A licença da empresa vence em {$dias} dia(s), em " . $this->data_validade->format('d/m/Y') . '.';
        }

        return null;
    }
}
