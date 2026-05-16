#!/usr/bin/env python3
import requests
import json

# Configurações
BASE_URL = "http://localhost:8000/api"

def login():
    """Fazer login e retornar token"""
    response = requests.post(f"{BASE_URL}/login", json={
        "email": "admin@sistema.com",
        "password": "010200"
    })

    if response.status_code == 200:
        data = response.json()
        print("✅ Login realizado com sucesso")
        return data.get("access_token")
    else:
        print(f"❌ Erro no login: {response.status_code}")
        print(response.text)
        return None

def get_agendas(token):
    """Buscar agendas disponíveis"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/agendas", headers=headers)

    if response.status_code == 200:
        agendas = response.json()
        if agendas:
            print(f"✅ Encontradas {len(agendas)} agendas")
            return agendas[0]["id"]  # Retorna ID da primeira agenda
        else:
            print("❌ Nenhuma agenda encontrada")
            return None
    else:
        print(f"❌ Erro ao buscar agendas: {response.status_code}")
        return None

def get_horarios_disponiveis(token, agenda_id):
    """Buscar horários disponíveis para uma agenda"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/agendas/{agenda_id}/horarios", headers=headers)

    if response.status_code == 200:
        horarios = response.json()
        print(f"✅ Horários disponíveis: {horarios}")
        return horarios[0] if horarios else None
    else:
        print(f"❌ Erro ao buscar horários: {response.status_code}")
        return None

def criar_agendamento(token, agenda_id, horario):
    """Criar um agendamento para testar o e-mail"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "agenda_id": agenda_id,
        "horario": horario,
        "email_cliente": "teste@email.com"
    }

    print(f"📧 Criando agendamento com dados: {data}")

    response = requests.post(f"{BASE_URL}/agendamentos", headers=headers, json=data)

    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        result = response.json()
        print("✅ Agendamento criado com sucesso!")
        print(f"ID: {result.get('id')}")
        print(f"Status: {result.get('status')}")
        return True
    else:
        print(f"❌ Erro ao criar agendamento: {response.text}")
        return False

def main():
    print("🧪 Teste de criação de agendamento com envio de e-mail")
    print("=" * 50)

    # 1. Login
    token = login()
    if not token:
        return

    # 2. Buscar agendas
    agenda_id = get_agendas(token)
    if not agenda_id:
        return

    # 3. Buscar horários disponíveis
    horario = get_horarios_disponiveis(token, agenda_id)
    if not horario:
        return

    # 4. Criar agendamento (isso deve enviar e-mail)
    print("\n📧 Testando envio de e-mail...")
    sucesso = criar_agendamento(token, agenda_id, horario)

    if sucesso:
        print("\n✅ Teste concluído! Verifique se o e-mail foi enviado.")
        print("📧 E-mail deve ter sido enviado para: teste@email.com")
    else:
        print("\n❌ Teste falhou!")

if __name__ == "__main__":
    main()