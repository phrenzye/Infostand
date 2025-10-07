import os
import tkinter as tk
from tkinter import ttk, messagebox
import json
from datetime import datetime
import sv_ttk
import re

class MediaCardAdder:
    def __init__(self, root):
        self.root = root
        self.root.title("Card Adder")
        self.root.geometry("600x550")
        self.root.resizable(False, False)
        
        # Применяем тему sv_ttk
        sv_ttk.set_theme("dark")
        
        # Создаем основной фрейм
        main_frame = ttk.Frame(root, padding="15")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Тип контента
        ttk.Label(main_frame, text="Тип контента:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.content_type = tk.StringVar(value="games")
        content_frame = ttk.Frame(main_frame)
        content_frame.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=5, columnspan=2)
        
        ttk.Radiobutton(content_frame, text="Игры", variable=self.content_type, 
                       value="games").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(content_frame, text="Фильмы", variable=self.content_type, 
                       value="movies").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(content_frame, text="Сериалы", variable=self.content_type, 
                       value="series").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(content_frame, text="Аниме", variable=self.content_type, 
                       value="anime").pack(side=tk.LEFT, padx=5)
        
        # Ссылка на фото
        ttk.Label(main_frame, text="Ссылка на фото:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.photo_link = ttk.Entry(main_frame, width=60)
        self.photo_link.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=5, padx=5, columnspan=2)
        
        # Название
        ttk.Label(main_frame, text="Название:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.name = ttk.Entry(main_frame, width=60)
        self.name.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5, padx=5, columnspan=2)
        
        # Рейтинг
        ttk.Label(main_frame, text="Рейтинг (1-10):").grid(row=3, column=0, sticky=tk.W, pady=5)
        rating_frame = ttk.Frame(main_frame)
        rating_frame.grid(row=3, column=1, sticky=tk.W, pady=5, padx=5)
        self.rate = ttk.Spinbox(rating_frame, from_=1, to=10, width=5)
        self.rate.pack(side=tk.LEFT)
        self.rate.set("5")
        ttk.Label(rating_frame, text="/10").pack(side=tk.LEFT, padx=5)
        
        # Жанр
        ttk.Label(main_frame, text="Жанр:").grid(row=4, column=0, sticky=tk.W, pady=5)
        self.genre = ttk.Combobox(main_frame, width=57, values=[
            "RPG", "Экшен", "Стратегия", "Симулятор", "Приключения", "Хоррор", 
            "Инди", "Казуальная", "Шутер", "Платформер", "Метроидвания", "Сложная", 
            "Выживание", "Рогалик", "ММО", "Кино", "Головоломка", "Драма", "Триллер", "Детектив", "Комедия", 
            "Исекай", "Фантастика", "Фэнтези", "Другое"
        ])
        self.genre.grid(row=4, column=1, sticky=(tk.W, tk.E), pady=5, padx=5, columnspan=2)
        self.genre.set("Другое")
        
        # Дата добавления
        ttk.Label(main_frame, text="Дата добавления:").grid(row=5, column=0, sticky=tk.W, pady=5)
        date_frame = ttk.Frame(main_frame)
        date_frame.grid(row=5, column=1, sticky=tk.W, pady=5, padx=5)
        
        self.day = ttk.Spinbox(date_frame, from_=1, to=31, width=3)
        self.day.pack(side=tk.LEFT)
        self.day.set(datetime.now().day)
        
        ttk.Label(date_frame, text=".").pack(side=tk.LEFT)
        
        self.month = ttk.Spinbox(date_frame, from_=1, to=12, width=3)
        self.month.pack(side=tk.LEFT)
        self.month.set(datetime.now().month)
        
        ttk.Label(date_frame, text=".").pack(side=tk.LEFT)
        
        self.year = ttk.Spinbox(date_frame, from_=2020, to=2030, width=5)
        self.year.pack(side=tk.LEFT)
        self.year.set(datetime.now().year)
        
        # Описание
        ttk.Label(main_frame, text="Описание:").grid(row=6, column=0, sticky=tk.W, pady=5)
        self.desc = tk.Text(main_frame, width=60, height=10)
        self.desc.grid(row=6, column=1, sticky=(tk.W, tk.E), pady=5, padx=5, columnspan=2)
        
        # Кнопки
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=7, column=0, columnspan=3, pady=20)
        
        ttk.Button(button_frame, text="Добавить карточку", 
                  command=self.add_card, style="Accent.TButton").pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Очистить", 
                  command=self.clear_fields).pack(side=tk.LEFT, padx=10)
        ttk.Button(button_frame, text="Просмотреть данные", 
                  command=self.view_data).pack(side=tk.LEFT, padx=10)
        
        # Настройка веса колонок для правильного растягивания
        main_frame.columnconfigure(1, weight=1)
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
    
    def get_data_file_path(self):
        """Определяет путь к файлу данных на основе выбранного типа контента"""
        content_type = self.content_type.get()
        return f"data/{content_type}.js"
    
    def load_existing_data(self):
        """Загружает существующие данные из файла"""
        file_path = self.get_data_file_path()
        
        if not os.path.exists(file_path):
            print(f"Файл {file_path} не существует, создаем новый")
            return []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"Загружаем данные из {file_path}")
            print(f"Длина файла: {len(content)} символов")
            
            # Пытаемся извлечь JSON разными способами
            json_data = None
            
            # Способ 1: Ищем window.*Data = [...];
            match = re.search(r'window\.\w+Data\s*=\s*(\[.*?\]);', content, re.DOTALL)
            if match:
                json_str = match.group(1)
                print(f"Нашли данные через regex: {len(json_str)} символов")
                json_data = json.loads(json_str)
            else:
                # Способ 2: Ищем просто массив
                match = re.search(r'(\[.*\])', content, re.DOTALL)
                if match:
                    json_str = match.group(1)
                    print(f"Нашли данные как массив: {len(json_str)} символов")
                    json_data = json.loads(json_str)
                else:
                    # Способ 3: Пытаемся загрузить весь файл как JSON
                    print("Пытаемся загрузить весь файл как JSON")
                    json_data = json.loads(content)
            
            if json_data:
                print(f"Успешно загружено {len(json_data)} карточек")
                return json_data
            else:
                print("Не удалось извлечь данные")
                return []
                
        except json.JSONDecodeError as e:
            print(f"Ошибка JSON: {e}")
            messagebox.showerror("Ошибка", f"Ошибка при чтении файла: {str(e)}")
            return []
        except Exception as e:
            print(f"Общая ошибка: {e}")
            messagebox.showerror("Ошибка", f"Не удалось загрузить данные: {str(e)}")
            return []
    
    def save_data(self, data):
        """Сохраняет данные в файл"""
        file_path = self.get_data_file_path()
        
        # Создаем директорию, если она не существует
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        try:
            content_type = self.content_type.get()
            js_content = f"// data/{content_type}.js\nwindow.{content_type}Data = {json.dumps(data, ensure_ascii=False, indent=2)};"
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(js_content)
            
            print(f"Успешно сохранено {len(data)} карточек в {file_path}")
            return True
        except Exception as e:
            print(f"Ошибка сохранения: {e}")
            messagebox.showerror("Ошибка", f"Не удалось сохранить данные: {str(e)}")
            return False
    
    def add_card(self):
        """Добавляет новую карточку в JSON файл"""
        # Получаем значения из полей ввода
        photo_link = self.photo_link.get().strip()
        name = self.name.get().strip()
        rate = self.rate.get().strip()
        genre = self.genre.get().strip()
        desc = self.desc.get("1.0", tk.END).strip()
        
        # Форматируем дату
        try:
            day = self.day.get().zfill(2)
            month = self.month.get().zfill(2)
            year = self.year.get()
            date_str = f"{day}.{month}.{year}"
        except:
            messagebox.showerror("Ошибка", "Некорректная дата!")
            return
        
        # Проверяем, что все обязательные поля заполнены
        if not all([photo_link, name, rate, desc]):
            messagebox.showerror("Ошибка", "Заполните все обязательные поля!")
            return
        
        # Проверяем корректность рейтинга
        try:
            rate_int = int(rate)
            if not (1 <= rate_int <= 10):
                raise ValueError
            rating_str = f"{rate_int}/10"
        except ValueError:
            messagebox.showerror("Ошибка", "Рейтинг должен быть целым числом от 1 до 10!")
            return
        
        # Создаем объект карточки
        new_card = {
            "name": name,
            "rating": rating_str,
            "date": date_str,
            "genre": genre,
            "image": photo_link,
            "description": desc
        }
        
        print(f"Создана новая карточка: {name}")
        
        # Загружаем существующие данные
        existing_data = self.load_existing_data()
        print(f"Загружено существующих карточек: {len(existing_data)}")
        
        # Добавляем новую карточку в начало массива (чтобы новые были первыми)
        existing_data.insert(0, new_card)
        print(f"Всего карточек после добавления: {len(existing_data)}")
        
        # Сохраняем обновленные данные
        if self.save_data(existing_data):
            messagebox.showinfo("Успех", f"Карточка успешно добавлена в {self.content_type.get()}!\nВсего карточек: {len(existing_data)}")
            self.clear_fields()
    
    def clear_fields(self):
        """Очищает все поля ввода"""
        self.photo_link.delete(0, tk.END)
        self.name.delete(0, tk.END)
        self.rate.set("5")
        self.genre.set("Другое")
        self.day.set(datetime.now().day)
        self.month.set(datetime.now().month)
        self.year.set(datetime.now().year)
        self.desc.delete("1.0", tk.END)
    
    def view_data(self):
        """Показывает текущие данные в выбранном файле"""
        data = self.load_existing_data()
        
        if not data:
            messagebox.showinfo("Данные", "Файл пуст или не существует.")
            return
        
        # Создаем окно для просмотра данных
        view_window = tk.Toplevel(self.root)
        view_window.title(f"Данные - {self.content_type.get()}")
        view_window.geometry("700x500")
        
        # Фрейм с прокруткой
        frame = ttk.Frame(view_window)
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Текстовое поле для отображения данных
        text_widget = tk.Text(frame, wrap=tk.WORD, font=("Consolas", 10))
        text_widget.pack(fill=tk.BOTH, expand=True)
        
        # Добавляем прокрутку
        scrollbar = ttk.Scrollbar(text_widget, orient=tk.VERTICAL, command=text_widget.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        text_widget.config(yscrollcommand=scrollbar.set)
        
        # Форматируем и выводим данные
        formatted_data = json.dumps(data, ensure_ascii=False, indent=2)
        text_widget.insert(tk.END, f"Всего карточек: {len(data)}\n\n")
        text_widget.insert(tk.END, formatted_data)
        text_widget.config(state=tk.DISABLED)

if __name__ == "__main__":
    root = tk.Tk()
    app = MediaCardAdder(root)
    root.mainloop()