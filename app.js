// Основное приложение
class RatingsApp {
    constructor() {
        this.currentTab = 'games';
        this.currentSort = 'date';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContent('games');
        this.updateStats();
        this.initTabIndicator();
    }

    setupEventListeners() {
        // Обработчики табов
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Обработчики сортировки
        document.getElementById('sort-name').addEventListener('click', () => {
            this.setSort('name');
        });
        document.getElementById('sort-rating').addEventListener('click', () => {
            this.setSort('rating');
        });
        document.getElementById('sort-date').addEventListener('click', () => {
            this.setSort('date');
        });

        // Обработчик поиска
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterAndDisplayContent();
        });

        // Секретная функция для показа/скрытия аниме
        this.setupSecretToggle();
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Обновляем активные табы
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
        
        document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        this.updateTabIndicator();
        this.filterAndDisplayContent();
    }

    setSort(sortType) {
        this.currentSort = sortType;
        
        // Обновляем активные кнопки сортировки
        document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`sort-${sortType}`).classList.add('active');
        
        this.filterAndDisplayContent();
    }

    loadContent(type) {
        this.filterAndDisplayContent();
    }

    filterAndDisplayContent() {
        const items = this.getCurrentItems();
        let filteredItems = [...items];

        // Применяем поиск
        if (this.searchQuery) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(this.searchQuery) ||
                item.description.toLowerCase().includes(this.searchQuery)
            );
        }

        // Применяем сортировку
        filteredItems = this.sortItems(filteredItems);

        // Отображаем результаты
        this.displayItems(filteredItems);
    }

    getCurrentItems() {
        switch(this.currentTab) {
            case 'games': return window.gamesData || [];
            case 'movies': return window.moviesData || [];
            case 'series': return window.seriesData || [];
            case 'anime': return window.animeData || [];
            default: return [];
        }
    }

    sortItems(items) {
        switch(this.currentSort) {
            case 'name':
                return items.sort((a, b) => a.name.localeCompare(b.name));
            case 'rating':
                return items.sort((a, b) => this.parseRating(b.rating) - this.parseRating(a.rating));
            case 'date':
                return items.sort((a, b) => this.parseCustomDate(b.date) - this.parseCustomDate(a.date));
            default:
                return items;
        }
    }

    parseRating(rating) {
        // Конвертируем рейтинг вида "9/10" в число
        const match = rating.match(/(\d+(?:\.\d+)?)\/10/);
        return match ? parseFloat(match[1]) : 0;
    }

    parseCustomDate(dateString) {
        // Парсим дату в формате ДД.ММ.ГГГГ или ДД.ММ.ГГ
        if (!dateString) return 0;
        
        // Убираем возможные пробелы
        const cleanDate = dateString.trim();
        
        // Проверяем формат ДД.ММ.ГГГГ или ДД.ММ.ГГ
        const dateMatch = cleanDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
        
        if (dateMatch) {
            let day = parseInt(dateMatch[1]);
            let month = parseInt(dateMatch[2]) - 1; // Месяцы в JS: 0-11
            let year = parseInt(dateMatch[3]);
            
            // Если год указан двумя цифрами, преобразуем в четыре
            if (year < 100) {
                year += 2000; // Предполагаем, что все даты после 2000 года
            }
            
            return new Date(year, month, day).getTime();
        }
        
        // Если формат не распознан, пытаемся распарсить как обычную дату
        const parsedDate = new Date(cleanDate);
        return isNaN(parsedDate) ? 0 : parsedDate.getTime();
    }

    generateStars(rating) {
        const numericRating = this.parseRating(rating);
        const starsCount = Math.round(numericRating / 2); // 10-балльная в 5-звездочную
        return '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
    }

    displayItems(items) {
        const grid = document.getElementById(`${this.currentTab}-grid`);
        
        if (items.length === 0) {
            grid.innerHTML = '<div class="no-results">Ничего не найдено. Попробуйте изменить поисковый запрос.</div>';
            return;
        }

        grid.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-image-container">
                    <div class="item-image-background" style="background-image: url('${item.image}')"></div>
                    <img src="${item.image}" alt="${item.name}" class="item-image" loading="lazy" 
                         onerror="this.style.display='none'; this.parentNode.querySelector('.item-image-background').style.backgroundImage='none'">
                </div>
                <div class="item-info">
                    <div class="item-name" title="${item.name}">${item.name}</div>
                    <div class="item-rating">
                        ${item.rating}
                        <span class="rating-stars">${this.generateStars(item.rating)}</span>
                    </div>
                    <div class="item-meta">
                        <span>${item.date}</span>
                        <span>${item.genre}</span>
                    </div>
                    <div class="item-description">${item.description}</div>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('total-games').textContent = (window.gamesData || []).length;
        document.getElementById('total-movies').textContent = (window.moviesData || []).length;
        document.getElementById('total-series').textContent = (window.seriesData || []).length;
    }

    initTabIndicator() {
        this.updateTabIndicator();
        window.addEventListener('resize', () => this.updateTabIndicator());
    }

    updateTabIndicator() {
        const activeTab = document.querySelector('.tab.active');
        const indicator = document.querySelector('.tab-indicator');
        
        if (activeTab && indicator) {
            indicator.style.width = `${activeTab.offsetWidth}px`;
            indicator.style.left = `${activeTab.offsetLeft}px`;
            indicator.style.opacity = '1';
        }
    }

    setupSecretToggle() {
        let lastKeyPressTime = 0;
        let keyPressCount = 0;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A' || e.keyCode === 65) {
                const currentTime = new Date().getTime();
                
                if (currentTime - lastKeyPressTime < 500) {
                    keyPressCount++;
                    if (keyPressCount === 1) {
                        this.toggleAnimeTab();
                    }
                } else {
                    keyPressCount = 0;
                }
                
                lastKeyPressTime = currentTime;
            }
        });

        // Тройное нажатие для мобильных
        const seriesTab = document.querySelector('.tab[data-tab="series"]');
        let tapCount = 0;
        let lastTapTime = 0;

        seriesTab.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const currentTime = new Date().getTime();
                
                if (currentTime - lastTapTime < 300) {
                    tapCount++;
                } else {
                    tapCount = 1;
                }
                
                lastTapTime = currentTime;
                
                if (tapCount === 3) {
                    e.preventDefault();
                    this.toggleAnimeTab();
                    tapCount = 0;
                }
            }
        });
    }

    toggleAnimeTab() {
        const animeTab = document.querySelector('.tab[data-tab="anime"]');
        const isHiding = !animeTab.classList.contains('hidden');
        
        animeTab.classList.toggle('hidden');
        
        if (isHiding && animeTab.classList.contains('active')) {
            this.switchTab('series');
        } else {
            this.updateTabIndicator();
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new RatingsApp();
});