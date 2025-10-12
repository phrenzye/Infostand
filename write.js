class WritingsApp {
    constructor() {
        this.writings = window.writingsData || [];
        this.init();
        this.setupBlinkingTitle();
    }

    init() {
        this.displayWritings();
        this.setupModal();
    }

    displayWritings() {
        const grid = document.getElementById('writings-grid');
        
        if (this.writings.length === 0) {
            grid.innerHTML = '<div class="no-results">Пока нет записей.</div>';
            return;
        }

        grid.innerHTML = this.writings.map(writing => `
            <div class="writing-card" data-file="${writing.file}">
                <div class="writing-image-container">
                    <div class="writing-image-background" style="background-image: url('${writing.image}')"></div>
                    <img src="${writing.image}" alt="${writing.name}" class="writing-image" loading="lazy" 
                         onerror="this.style.display='none'; this.parentNode.querySelector('.writing-image-background').style.backgroundImage='none'">
                </div>
                <div class="writing-info">
                    <div class="writing-name" title="${writing.name}">${writing.name}</div>
                    <div class="writing-description">${writing.description}</div>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики клика на карточки
        document.querySelectorAll('.writing-card').forEach(card => {
            card.addEventListener('click', () => {
                const file = card.getAttribute('data-file');
                this.openModal(file, card.querySelector('.writing-name').textContent);
            });
        });
    }

    setupModal() {
        this.modal = document.getElementById('text-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalText = document.getElementById('modal-text');
        
        // Закрытие модального окна
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Закрытие при клике вне контента
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    setupBlinkingTitle() {
    const title = document.querySelector('h1');
    const originalText = "Библиотека Phrenzye";
    const blinkText = "Библиотека графомана";
    
    setInterval(() => {
        // Случайное решение - мигает примерно каждые 2 секунды с 20% вероятностью
        if (Math.random() < 0.2) {
            title.textContent = blinkText;
            setTimeout(() => {
                title.textContent = originalText;
            }, 300); // Возврат через 300ms
        }
    }, 2000); // Проверка каждые 2 секунды
	}

    openModal(file, title) {
        this.modalTitle.textContent = title;
        this.modalText.innerHTML = '<div style="text-align: center; padding: 20px;">Загрузка...</div>';
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Загружаем текст из файла
        this.loadTextFile(file);
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.modalText.innerHTML = '';
    }

    loadTextFile(file) {
        const filePath = `writedata/${file}`;
        
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Файл не найден');
                }
                return response.text();
            })
            .then(text => {
                // Форматируем текст - заменяем переносы строк на HTML
                const formattedText = text.replace(/\n/g, '<br>');
                this.modalText.innerHTML = formattedText;
            })
            .catch(error => {
                console.error('Ошибка загрузки файла:', error);
                this.modalText.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <h3>Ошибка загрузки</h3>
                        <p>Не удалось загрузить текст: ${error.message}</p>
                    </div>
                `;
            });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new WritingsApp();
});