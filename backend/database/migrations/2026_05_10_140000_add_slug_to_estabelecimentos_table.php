<?php

use App\Models\Estabelecimento;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estabelecimentos', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('empresa_id');
        });

        Estabelecimento::query()
            ->select(['id', 'nome'])
            ->orderBy('id')
            ->get()
            ->each(function (Estabelecimento $estabelecimento): void {
                $base = Str::slug($estabelecimento->nome) ?: "local-{$estabelecimento->id}";
                $slug = $base;
                $suffix = 2;

                while (Estabelecimento::where('slug', $slug)->whereKeyNot($estabelecimento->id)->exists()) {
                    $slug = "{$base}-{$suffix}";
                    $suffix++;
                }

                $estabelecimento->forceFill(['slug' => $slug])->saveQuietly();
            });

        Schema::table('estabelecimentos', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('estabelecimentos', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
