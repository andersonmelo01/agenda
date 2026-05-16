<?php
namespace App\Http\Controllers;

use App\Models\SmtpSetting;
use Illuminate\Http\Request;

class SmtpSettingController extends Controller
{
    public function index()
    {
        $smtp = SmtpSetting::first();

        return response()->json($smtp ? $smtp->makeHidden(['password']) : null);
    }

    public function store(Request $request)
    {
        $smtp = SmtpSetting::first();
        $validated = $request->validate([
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer'],
            'username' => ['required', 'string', 'max:255'],
            'password' => [$smtp ? 'nullable' : 'required', 'string'],
            'encryption' => ['nullable', 'string', 'max:50'],
            'from_address' => ['nullable', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:255'],
        ]);

        if ($smtp) {
            if (blank($validated['password'] ?? null)) {
                unset($validated['password']);
            }
            $smtp->update($validated);
        } else {
            $smtp = SmtpSetting::create($validated);
        }

        return response()->json($smtp->makeHidden(['password']));
    }
}
