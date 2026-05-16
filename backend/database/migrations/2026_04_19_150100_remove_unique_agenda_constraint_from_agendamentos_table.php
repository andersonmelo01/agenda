<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->dropForeign(['agenda_id']);
            $table->dropUnique('agendamentos_agenda_id_unique');
            $table->index('agenda_id');
            $table->foreign('agenda_id')->references('id')->on('agendas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->dropForeign(['agenda_id']);
            $table->dropIndex(['agenda_id']);
            $table->unique('agenda_id');
            $table->foreign('agenda_id')->references('id')->on('agendas')->onDelete('cascade');
        });
    }
};
