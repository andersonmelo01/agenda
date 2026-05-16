<?php

use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AgendamentoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\EspecialidadeController;
use App\Http\Controllers\EstabelecimentoController;
use App\Http\Controllers\PlanoController;
use App\Http\Controllers\ProfissionalController;
use App\Http\Controllers\SmtpSettingController;
use App\Http\Controllers\ServicoController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

Route::prefix('public')->group(function () {
    Route::get('estabelecimentos', [EstabelecimentoController::class, 'publicIndex']);
    Route::get('estabelecimentos/{slug}', [EstabelecimentoController::class, 'publicShow']);
    Route::get('profissionais', [ProfissionalController::class, 'publicIndex']);
    Route::get('servicos', [ServicoController::class, 'publicIndex']);
    Route::get('agendas', [AgendaController::class, 'publicIndex']);
});

Route::get('agendas/{agenda}/horarios', [AgendaController::class, 'horarios']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::post('agendamentos', [AgendamentoController::class, 'store']);
    Route::get('me/agendamentos', [AgendamentoController::class, 'mine']);
    Route::patch('me/agendamentos/{agendamento}/cancelar', [AgendamentoController::class, 'cancelMine']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('users', [UserController::class, 'index']);

    Route::apiResource('estabelecimentos', EstabelecimentoController::class);
    Route::apiResource('profissionais', ProfissionalController::class);
    Route::apiResource('especialidades', EspecialidadeController::class);
    Route::apiResource('servicos', ServicoController::class);
    Route::apiResource('agendas', AgendaController::class);

    Route::get('agendamentos', [AgendamentoController::class, 'index']);
    Route::get('agendamentos/{agendamento}', [AgendamentoController::class, 'show']);
    Route::put('agendamentos/{agendamento}', [AgendamentoController::class, 'update']);
    Route::patch('agendamentos/{agendamento}', [AgendamentoController::class, 'update']);
    Route::delete('agendamentos/{agendamento}', [AgendamentoController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'gestor'])->group(function () {
    Route::apiResource('planos', PlanoController::class);
    Route::apiResource('empresas', EmpresaController::class);
    Route::get('smtp-setting', [SmtpSettingController::class, 'index']);
    Route::post('smtp-setting', [SmtpSettingController::class, 'store']);
});
