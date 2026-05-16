<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Servico extends Model
{
    protected $fillable = [
        'estabelecimento_id', 'nome', 'descricao', 'preco'
    ];

    protected $casts = [
        'preco' => 'decimal:2',
    ];

    public function estabelecimento(): BelongsTo
    {
        return $this->belongsTo(Estabelecimento::class);
    }

    public function agendas(): HasMany
    {
        return $this->hasMany(Agenda::class);
    }
}
