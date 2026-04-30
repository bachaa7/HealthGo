"""Background задачи для напоминаний."""

import threading
import time
from datetime import datetime
from app.database import SessionLocal
from app.models import Reminder
from app.email_service import send_reminder_email


def check_and_send_reminders():
    """Проверить и отправить напоминания по email."""
    db = SessionLocal()
    try:
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.notify_email == True
        ).all()
        
        if not reminders:
            return
        
        current_time = datetime.now()
        current_hour = current_time.strftime("%H:%M")
        day_map = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
        current_day = day_map[current_time.weekday()]
        
        for reminder in reminders:
            if current_hour != reminder.time:
                continue
                
            if current_day not in (reminder.days or []):
                continue
            
            user = reminder.user
            if not user or not user.email:
                continue
            
            if reminder.last_sent:
                last_sent_hour = reminder.last_sent.strftime("%H:%M")
                today_date = current_time.strftime("%Y-%m-%d")
                last_sent_date = reminder.last_sent.strftime("%Y-%m-%d")
                
                if last_sent_hour == current_hour and last_sent_date == today_date:
                    continue
            
            success = send_reminder_email(
                to_email=user.email,
                name=user.name,
                reminder_title=reminder.title,
                reminder_time=reminder.time
            )
            
            if success:
                reminder.last_sent = current_time
                db.commit()
                
    except Exception as e:
        print(f"Ошибка при проверке напоминаний: {e}")
    finally:
        db.close()


def start_reminder_scheduler():
    """Запустить планировщик напоминаний в фоновом режиме."""
    def run_scheduler():
        while True:
            try:
                check_and_send_reminders()
            except Exception as e:
                print(f"Ошибка scheduler: {e}")
            time.sleep(60)
    
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    print("✓ Планировщик напоминаний запущен")
    return thread