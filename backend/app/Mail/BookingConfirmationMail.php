<?php

namespace App\Mail;

use App\Models\Agendamento;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Agendamento $agendamento)
    {
    }

    public function build(): self
    {
        return $this->subject('Confirmação de agendamento')
            ->view('emails.agendamento-status')
            ->with([
                'heading' => 'Seu agendamento foi confirmado',
                'bodyMessage' => 'Sua reserva foi registrada com sucesso. Abaixo estão os detalhes do horário escolhido.',
                'agendamento' => $this->agendamento,
                'statusLabel' => 'Confirmado',
                'accent' => '#0f766e',
            ]);
    }
}
