<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profissional extends Model
{
    /**
     * Nome da tabela no banco de dados.
     *
     * @var string
     */
    protected $table = 'profissionais';
    protected $fillable = [
        'estabelecimento_id', 'nome', 'email'
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
