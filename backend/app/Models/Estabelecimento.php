<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estabelecimento extends Model
{
    protected $fillable = [
        'empresa_id',
        'slug',
        'nome',
        'segmento',
        'status',
        'data_validade',
        'email',
        'senha',
        'telefone_contato',
        'whatsapp',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'estado',
    ];

    protected $hidden = [
        'senha',
    ];

    protected $appends = [
        'endereco_completo',
        'dias_para_vencimento',
        'atendimento_vencido',
        'atendimento_bloqueado',
        'atendimento_mensagem',
    ];

    protected $casts = [
        'data_validade' => 'date:Y-m-d',
    ];

    public function getEnderecoCompletoAttribute(): string
    {
        $street = trim(implode(', ', array_filter([
            $this->logradouro,
            $this->numero,
        ])));

        $district = trim(implode(' - ', array_filter([
            $this->bairro,
            $this->complemento,
        ])));

        $city = trim(implode(' / ', array_filter([
            $this->cidade,
            $this->estado,
        ])));

        return implode(' | ', array_filter([
            $street,
            $district,
            $city,
            $this->cep ? "CEP {$this->cep}" : null,
        ]));
    }

    public function profissionais(): HasMany
    {
        return $this->hasMany(Profissional::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function servicos(): HasMany
    {
        return $this->hasMany(Servico::class);
    }

    public function scopeComAtendimentoAtivo($query)
    {
        return $query
            ->where('status', 'ativo')
            ->whereDate('data_validade', '>=', now()->toDateString())
            ->whereHas('empresa', fn ($empresa) => $empresa->comLicencaAtiva());
    }

    public function getDiasParaVencimentoAttribute(): ?int
    {
        if (! $this->data_validade) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->data_validade->copy()->startOfDay(), false);
    }

    public function getAtendimentoVencidoAttribute(): bool
    {
        return $this->data_validade
            ? $this->data_validade->copy()->startOfDay()->lt(now()->startOfDay())
            : false;
    }

    public function getAtendimentoBloqueadoAttribute(): bool
    {
        $status = $this->attributes['status'] ?? 'ativo';

        return $status !== 'ativo' || $this->atendimento_vencido;
    }

    public function getAtendimentoMensagemAttribute(): ?string
    {
        $status = $this->attributes['status'] ?? 'ativo';

        if ($status !== 'ativo') {
            return 'Este estabelecimento está ' . $status . ' e não está recebendo agendamentos.';
        }

        if ($this->atendimento_vencido) {
            return 'A validade deste estabelecimento venceu em ' . $this->data_validade->format('d/m/Y') . '.';
        }

        return null;
    }
}
