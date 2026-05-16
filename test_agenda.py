import requests

# Login
r = requests.post('http://127.0.0.1:8000/api/login', json={'email':'admin@sistema.com','password':'010200'})
print('Login status:', r.status_code)
if r.status_code == 200:
    token = r.json().get('access_token')
    print('Token:', token[:50] + '...' if token else 'None')

    # Criar agenda com intervalos
    headers = {'Authorization': f'Bearer {token}'}
    agenda_data = {
        'profissional_id': 1,
        'servico_id': 1,
        'data': '2026-04-20',
        'intervalo_minutos': 30,
        'intervalos': [
            {'hora_inicio': '09:00', 'hora_fim': '12:00'},
            {'hora_inicio': '14:00', 'hora_fim': '18:00'}
        ],
        'status': 'disponivel'
    }

    r2 = requests.post('http://127.0.0.1:8000/api/agendas', json=agenda_data, headers=headers)
    print('Agenda creation status:', r2.status_code)
    print('Response:', r2.text)

    if r2.status_code == 201:
        agenda_id = r2.json().get('id')
        print('Agenda ID:', agenda_id)

        # Testar horários disponíveis
        r3 = requests.get(f'http://127.0.0.1:8000/api/agendas/{agenda_id}/horarios', headers=headers)
        print('Horarios status:', r3.status_code)
        print('Horarios:', r3.json())
else:
    print('Login failed:', r.text)