<?php

namespace App\Support;

use App\Models\SmtpSetting;

class MailConfiguration
{
    public static function apply(): void
    {
        $smtp = SmtpSetting::query()->first();

        if (! $smtp) {
            return;
        }

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => $smtp->host,
            'mail.mailers.smtp.port' => (int) $smtp->port,
            'mail.mailers.smtp.username' => $smtp->username,
            'mail.mailers.smtp.password' => $smtp->password,
            'mail.mailers.smtp.encryption' => $smtp->encryption ?: null,
            'mail.from.address' => $smtp->from_address ?: config('mail.from.address'),
            'mail.from.name' => $smtp->from_name ?: config('mail.from.name'),
        ]);
    }
}
