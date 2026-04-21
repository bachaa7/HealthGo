"""Модуль отправки email через Gmail SMTP."""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    """Отправить письмо с ссылкой на сброс пароля."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"⚠ SMTP не настроен. Токен для {to_email}: {token}")
        print(f"   Ссылка: {FRONTEND_URL}/reset-password?token={token}")
        return False

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">HealthGo</h1>
        </div>
        <div style="background: #f8f5f3; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Восстановление пароля</h2>
            <p>Здравствуйте, <strong>{name}</strong>!</p>
            <p>Мы получили запрос на восстановление пароля от вашей учётной записи.</p>
            <p>Чтобы задать новый пароль, перейдите по ссылке ниже:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}"
                   style="background: #4CAF50; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 8px; display: inline-block;
                          font-weight: 600;">
                    Сбросить пароль
                </a>
            </p>
            <p style="color: #666; font-size: 14px;">
                Или скопируйте эту ссылку в браузер:<br>
                <a href="{reset_link}" style="color: #4CAF50; word-break: break-all;">{reset_link}</a>
            </p>
            <p style="color: #999; font-size: 13px; margin-top: 30px;">
                Ссылка действительна в течение 1 часа.
                Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
            </p>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            © HealthGo — Ваш ассистент здорового образа жизни
        </p>
    </body>
    </html>
    """

    text_body = f"""
Здравствуйте, {name}!

Для восстановления пароля перейдите по ссылке:
{reset_link}

Ссылка действительна 1 час.
Если вы не запрашивали восстановление — проигнорируйте письмо.

HealthGo
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Восстановление пароля HealthGo"
    msg["From"] = f"HealthGo <{SMTP_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"✓ Письмо отправлено на {to_email}")
        return True
    except Exception as e:
        print(f"✗ Ошибка отправки email: {e}")
        return False
