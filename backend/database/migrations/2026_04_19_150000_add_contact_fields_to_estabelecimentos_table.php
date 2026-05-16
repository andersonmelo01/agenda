<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estabelecimentos', function (Blueprint $table) {
            $table->string('telefone_contato', 20)->nullable()->after('email');
            $table->string('whatsapp', 20)->nullable()->after('telefone_contato');
            $table->string('cep', 9)->nullable()->after('whatsapp');
            $table->string('logradouro')->nullable()->after('cep');
            $table->string('numero', 30)->nullable()->after('logradouro');
            $table->string('complemento', 120)->nullable()->after('numero');
            $table->string('bairro', 120)->nullable()->after('complemento');
            $table->string('cidade', 120)->nullable()->after('bairro');
            $table->string('estado', 2)->nullable()->after('cidade');
        });
    }

    public function down(): void
    {
        Schema::table('estabelecimentos', function (Blueprint $table) {
            $table->dropColumn([
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
        });
    }
};
