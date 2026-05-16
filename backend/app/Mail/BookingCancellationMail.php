<?php

namespace App\Mail;

use App\Models\Agendamento;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingCancellationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Agendamento $agendamento)
    {
    }

    public function build(): self
    {
        return $this->subject('Cancelamento de agendamento')
            ->view('emails.agendamento-status')
            ->with([
                'heading' => 'Seu agendamento foi cancelado',
                'message' => 'A reserva foi cancelada com sucesso e o horário voltou a ficar disponível no sistema.',
                'agendamento' => $this->agendamento,
                'statusLabel' => 'Cancelado',
                'accent' => '#dc2626',
            ]);
    }
}
