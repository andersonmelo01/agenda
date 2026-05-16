<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plano extends Model
{
    protected $table = 'planos';

    protected $fillable = [
        'nome',
        'codigo',
        'descricao',
        'preco_base',
        'preco_por_local',
        'limite_locais',
        'ativo',
    ];

    protected $casts = [
        'preco_base' => 'decimal:2',
        'preco_por_local' => 'decimal:2',
        'limite_locais' => 'integer',
        'ativo' => 'boolean',
    ];

    public function empresas(): HasMany
    {
        return $this->hasMany(Empresa::class);
    }

    public function isStart(): bool
    {
        return $this->codigo === 'start';
    }
}
