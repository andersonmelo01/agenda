<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Estabelecimento;
use App\Models\Plano;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $start = Plano::updateOrCreate(
            ['codigo' => 'start'],
            [
                'nome' => 'Start',
                'descricao' => 'Plano inicial com direito a 1 local.',
                'preco_base' => 99,
                'preco_por_local' => 0,
                'limite_locais' => 1,
                'ativo' => true,
            ]
        );

        Plano::updateOrCreate(
            ['codigo' => 'pro'],
            [
                'nome' => 'Pro',
                'descricao' => 'Plano configuravel conforme a quantidade de locais/filiais contratadas.',
                'preco_base' => 149,
                'preco_por_local' => 49,
                'limite_locais' => null,
                'ativo' => true,
            ]
        );

        $empresaPadrao = Empresa::updateOrCreate(
            ['nome' => 'Empresa Demonstração'],
            [
                'plano_id' => $start->id,
                'email' => 'empresa@demo.com',
                'telefone' => '(11) 4000-0000',
                'status' => 'ativo',
                'limite_locais' => 1,
                'valor_mensal' => 99,
                'data_validade' => now()->addYear()->toDateString(),
            ]
        );

        Estabelecimento::query()
            ->whereNull('empresa_id')
            ->update(['empresa_id' => $empresaPadrao->id]);

        User::updateOrCreate(
            ['email' => 'admin@sistema.com'],
            [
                'empresa_id' => null,
                'name' => 'Administrador do Sistema',
                'password' => Hash::make('010200'),
                'role' => 'gestor',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'andersonmelo01@gmail.com'],
            [
                'empresa_id' => null,
                'name' => 'Anderson Melo',
                'phone' => '(11) 99999-0000',
                'birth_date' => '1990-01-01',
                'password' => Hash::make('010200'),
                'role' => 'cliente',
                'email_verified_at' => now(),
            ]
        );
    }
}
