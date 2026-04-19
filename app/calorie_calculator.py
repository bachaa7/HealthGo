def calculate_bmr(age, gender, weight, height):
    if gender.lower() == 'm':
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        return (10 * weight) + (6.25 * height) - (5 * age) - 161


def calculate_calories(bmr, activity_level):
    if activity_level == 1:
        return bmr * 1.2
    elif activity_level == 2:
        return bmr * 1.55
    elif activity_level == 3:
        return bmr * 1.725
    else:
        return bmr


def adjust_calories_for_goal(calories, goal):
    goal = goal.lower()
    if goal == "похудение":
        return calories - calories * 0.2
    elif goal == "набор":
        return calories + calories * 0.2
    return calories


def calculate_bmi(weight, height_cm):
    height_m = height_cm / 100
    bmi = weight / (height_m ** 2)

    if bmi < 16:
        classification = "Выраженный дефицит массы тела"
    elif 16 <= bmi < 18.5:
        classification = "Минимальная масса тела"
    elif 18.5 <= bmi < 25:
        classification = "Масса тела в норме"
    elif 25 <= bmi < 30:
        classification = "Избыток веса"
    elif 30 <= bmi < 35:
        classification = "Первая степень ожирения"
    elif 35 <= bmi < 40:
        classification = "Вторая степень ожирения"
    else:
        classification = "Третья степень ожирения"

    return round(bmi, 2), classification


def calculate_macronutrients(calories, gender):
    gender = gender.lower()
    if gender == 'm':
        proteins = (calories * 0.3) / 4
        fats = (calories * 0.2) / 9
        carbs = (calories * 0.5) / 4
    else:
        proteins = (calories * 0.3) / 4
        fats = (calories * 0.1) / 9
        carbs = (calories * 0.6) / 4
    return round(proteins, 1), round(fats, 1), round(carbs, 1)
