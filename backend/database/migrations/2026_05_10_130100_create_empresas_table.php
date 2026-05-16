<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plano_id')->constrained('planos')->restrictOnDelete();
            $table->string('nome');
            $table->string('documento', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('telefone', 30)->nullable();
            $table->string('status')->default('ativo');
            $table->unsignedInteger('limite_locais')->default(1);
            $table->decimal('valor_mensal', 10, 2)->default(0);
            $table->date('data_validade')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
