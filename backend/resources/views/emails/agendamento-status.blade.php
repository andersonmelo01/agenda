<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $heading }}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,.12);">
                    <tr>
                        <td style="background:{{ $accent }};padding:32px 36px;color:#fff;">
                            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:bold;opacity:.88;">Agenda Pro</div>
                            <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;">{{ $heading }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:36px;">
                            <p style="font-size:16px;line-height:1.7;margin:0 0 24px;">{{ $bodyMessage }}</p>

                            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:24px;">
                                <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;margin-bottom:10px;font-weight:bold;">Status</div>
                                <div style="font-size:18px;font-weight:bold;color:{{ $accent }};">{{ $statusLabel }}</div>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;width:180px;">Estabelecimento</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->profissional && $agendamento->agenda->profissional->estabelecimento ? $agendamento->agenda->profissional->estabelecimento->nome : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">Endereço</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->profissional && $agendamento->agenda->profissional->estabelecimento ? ($agendamento->agenda->profissional->estabelecimento->endereco_completo ?: '-') : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">Serviço</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->servico ? $agendamento->agenda->servico->nome : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">Profissional</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->profissional ? $agendamento->agenda->profissional->nome : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">Data</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->data ? \Carbon\Carbon::parse($agendamento->agenda->data)->format('d/m/Y') : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">Horário</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->horario ? $agendamento->horario : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">Telefone</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->profissional && $agendamento->agenda->profissional->estabelecimento ? ($agendamento->agenda->profissional->estabelecimento->telefone_contato ?: '-') : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">WhatsApp</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->profissional && $agendamento->agenda->profissional->estabelecimento ? ($agendamento->agenda->profissional->estabelecimento->whatsapp ?: '-') : '-' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0;color:#64748b;">E-mail do local</td>
                                    <td style="padding:8px 0;font-weight:bold;">{{ $agendamento && $agendamento->agenda && $agendamento->agenda->profissional && $agendamento->agenda->profissional->estabelecimento ? ($agendamento->agenda->profissional->estabelecimento->email ?: '-') : '-' }}</td>
                                </tr>
                            </table>

                            <p style="font-size:14px;line-height:1.7;color:#64748b;margin:24px 0 0;">
                                Se você não reconhece esta operação, entre em contato com a equipe responsável.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
