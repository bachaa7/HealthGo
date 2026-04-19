from sc_client.client import connect, disconnect, is_connected
from sc_client.models import ScTemplate
from sc_client.constants import sc_types


# Подключение к OSTIS серверу
url = "ws://localhost:8090/ws_json"

def connect_to_ostis():
    """ Функция для подключения к OSTIS серверу """
    connect(url)

    if is_connected():
        print("Успешное подключение к OSTIS серверу!")
    else:
        print("Нет подключения")
        disconnect()

