// Основное приложение
class RatingsApp {
    constructor() {
        this.currentTab = 'about';
        this.currentSort = 'date';
        this.searchQuery = '';
        this.currentMusicView = 'list';
        this.allTracks = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContent('about');
        this.initTabIndicator();
        this.setupBlinkingTitle();
        this.setupWritingsModal();
    }

    setupEventListeners() {
        // Обработчики табов
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Обработчики сортировки для игр, фильмов, сериалов, аниме
        ['games', 'movies', 'series', 'anime', 'books'].forEach(type => { // Добавили 'anime'
            document.getElementById(`sort-name-${type}`)?.addEventListener('click', () => {
                this.setSort('name', type);
            });
            document.getElementById(`sort-rating-${type}`)?.addEventListener('click', () => {
                this.setSort('rating', type);
            });
            document.getElementById(`sort-date-${type}`)?.addEventListener('click', () => {
                this.setSort('date', type);
            });
        });

        // Обработчики поиска для игр, фильмов, сериалов, аниме
        ['games', 'movies', 'series', 'anime', 'books'].forEach(type => { // Добавили 'anime'
            document.getElementById(`search-input-${type}`)?.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterAndDisplayContent(type);
            });
        });

        // Обработчики для музыки
        document.getElementById('sort-alphabet-music')?.addEventListener('click', () => {
            this.sortMusicTracks('alphabet');
        });
        document.getElementById('sort-recent-music')?.addEventListener('click', () => {
            this.sortMusicTracks('recent');
        });
        document.getElementById('sort-popular-music')?.addEventListener('click', () => {
            this.sortMusicTracks('popular');
        });
        document.getElementById('view-toggle-music')?.addEventListener('click', () => {
            this.toggleMusicView();
        });
        document.getElementById('search-input-music')?.addEventListener('input', (e) => {
            this.searchMusicTracks(e.target.value);
        });

        // Обработчик для закрытия предупреждения VPN
        document.getElementById('vpnWarningClose')?.addEventListener('click', () => {
            this.closeVpnWarning();
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
        
        // Загружаем контент для соответствующей вкладки
        if (['games', 'movies', 'series', 'anime', 'books'].includes(tabName)) { // Добавили 'anime'
            this.filterAndDisplayContent(tabName);
        } else if (tabName === 'music') {
            this.loadMusicData();
        } else if (tabName === 'library') {
            this.displayWritings();
        }
    }

    setSort(sortType, contentType) {
        this.currentSort = sortType;
        
        // Обновляем активные кнопки сортировки
        const controls = document.querySelector(`#${contentType}-content .controls`);
        if (controls) {
            controls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            controls.querySelector(`#sort-${sortType}-${contentType}`).classList.add('active');
        }
        
        this.filterAndDisplayContent(contentType);
    }

    loadContent(type) {
        this.filterAndDisplayContent(type);
    }

    filterAndDisplayContent(type) {
        const items = this.getCurrentItems(type);
        let filteredItems = [...items];

        // Применяем поиск
        if (this.searchQuery) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(this.searchQuery) ||
                (item.description && item.description.toLowerCase().includes(this.searchQuery))
            );
        }

        // Применяем сортировку
        filteredItems = this.sortItems(filteredItems, type);

        // Отображаем результаты
        this.displayItems(filteredItems, type);
    }

    getCurrentItems(type) {
        switch(type) {
            case 'games': return window.gamesData || [];
            case 'movies': return window.moviesData || [];
            case 'series': return window.seriesData || [];
            case 'anime': return window.animeData || [];
            case 'books': return window.booksData || []; 
            default: return [];
        }
    }

    sortItems(items, type) {
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
        const match = rating.match(/(\d+(?:\.\d+)?)\/10/);
        return match ? parseFloat(match[1]) : 0;
    }

    parseCustomDate(dateString) {
        if (!dateString) return 0;
        
        const cleanDate = dateString.trim();
        const dateMatch = cleanDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
        
        if (dateMatch) {
            let day = parseInt(dateMatch[1]);
            let month = parseInt(dateMatch[2]) - 1;
            let year = parseInt(dateMatch[3]);
            
            if (year < 100) {
                year += 2000;
            }
            
            return new Date(year, month, day).getTime();
        }
        
        const parsedDate = new Date(cleanDate);
        return isNaN(parsedDate) ? 0 : parsedDate.getTime();
    }

    generateStars(rating) {
        const numericRating = this.parseRating(rating);
        const starsCount = Math.round(numericRating / 2);
        return '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
    }

    displayItems(items, type) {
        const grid = document.getElementById(`${type}-grid`);
        
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

    // Музыкальные функции
    async loadMusicData() {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = 'Загрузка данных...';
        }
        
        this.allTracks = await this.loadCSVFile();
        
        if (this.allTracks.length > 0 && loadingMessage) {
            loadingMessage.style.display = 'none';
            this.displayMusicTracks(this.allTracks);
        }
    }

    extractTrackId(url) {
        try {
            if (url.includes('spotify:track:')) {
                return url.split('spotify:track:')[1];
            }
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const trackIndex = pathParts.indexOf('track');
            if (trackIndex !== -1 && pathParts[trackIndex + 1]) {
                return pathParts[trackIndex + 1];
            }
        } catch (error) {
            console.error('Ошибка извлечения track_id:', error);
        }
        return null;
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        const tracks = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            
            values.push(currentValue);
            
            const trackId = this.extractTrackId(values[0] || '');
            const duration = parseInt(values[5]) || 0;
            
            const track = {
                name: values[1] || 'Неизвестный трек',
                artist: (values[3] || 'Неизвестный исполнитель').replace(/;/g, ', '),
                album: values[2] || 'Неизвестный альбом',
                popularity: parseInt(values[6]) || 0,
                explicit: values[7] === 'true',
                releaseDate: values[4] || 'Неизвестная дата',
                duration: duration,
                formattedDuration: this.formatDuration(duration),
                genres: values[10] || '',
                url: values[0] || '',
                trackId: trackId,
                embedUrl: trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=oembed&theme=0` : null
            };
            
            tracks.push(track);
        }
        
        return tracks;
    }

    async loadCSVFile() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`Liked_Songs.csv?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка загрузки файла: ${response.status}`);
            }
            
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error('Ошибка загрузки CSV файла:', error);
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = 'Ошибка загрузки: ' + error.message;
            }
            return [];
        }
    }

    displayMusicTracks(tracksToDisplay) {
        if (this.currentMusicView === 'embed') {
            this.displayTracksAsEmbed(tracksToDisplay);
        } else {
            this.displayTracksAsList(tracksToDisplay);
        }
    }

    displayTracksAsEmbed(tracksToDisplay) {
        const container = document.getElementById('tracks-container');
        container.innerHTML = '';
        container.className = 'tracks-container embed-view';

        if (tracksToDisplay.length === 0) {
            container.innerHTML = '<div class="no-results">Треки не найдены. Попробуйте изменить поисковый запрос.</div>';
            return;
        }

        tracksToDisplay.forEach(track => {
            const trackCard = document.createElement('div');
            trackCard.className = 'track-card embed-card';
            
            if (track.embedUrl) {
                trackCard.innerHTML = `
                    <div class="embed-container">
                        <iframe 
                            src="${track.embedUrl}"
                            width="100%" 
                            height="152" 
                            frameborder="0" 
                            allowtransparency="true" 
                            allow="encrypted-media"
                            loading="lazy"
                            title="Spotify Embed: ${track.name}">
                        </iframe>
                    </div>
                    <div class="track-info-overlay">
                        <div class="track-meta-info">
                            <span class="popularity-badge">${track.popularity}%</span>
                            ${track.explicit ? '<span class="explicit-badge">Explicit</span>' : ''}
                            <span class="duration-badge">${track.formattedDuration}</span>
                        </div>
                    </div>
                `;
            } else {
                trackCard.innerHTML = `
                    <div class="no-embed">
                        <div class="no-embed-icon">🎵</div>
                        <div class="no-embed-info">
                            <div class="track-name">${track.name}</div>
                            <div class="artist-name">${track.artist}</div>
                            <div class="album-name">${track.album}</div>
                        </div>
                        <a href="${track.url}" target="_blank" class="spotify-link">Открыть в Spotify</a>
                    </div>
                `;
            }
            
            container.appendChild(trackCard);
        });
    }

    displayTracksAsList(tracksToDisplay) {
        const container = document.getElementById('tracks-container');
        container.innerHTML = '';
        container.className = 'tracks-container list-view';

        if (tracksToDisplay.length === 0) {
            container.innerHTML = '<div class="no-results">Треки не найдены. Попробуйте изменить поисковый запрос.</div>';
            return;
        }

        const tracksList = document.createElement('div');
        tracksList.className = 'tracks-list';

        tracksToDisplay.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item list-item';
            
            trackItem.innerHTML = `
                <div class="track-content">
                    <div class="track-info">
                        <div class="track-name" title="${track.name}">${track.name}</div>
                        <div class="artist-name" title="${track.artist}">${track.artist}</div>
                        <div class="album-name" title="${track.album}">${track.album}</div>
                    </div>
                    <div class="track-meta">
                        <div class="popularity">${track.popularity}%</div>
                        <div class="duration">${track.formattedDuration}</div>
                        ${track.explicit ? '<div class="explicit">E</div>' : ''}
                    </div>
                    <div class="track-actions">
                        <a href="${track.url}" target="_blank" class="spotify-link-btn">Открыть в Spotify</a>
                    </div>
                </div>
            `;
            
            tracksList.appendChild(trackItem);
        });

        container.appendChild(tracksList);
    }

    toggleMusicView() {
        if (this.currentMusicView === 'list') {
            this.currentMusicView = 'embed';
            document.getElementById('view-toggle-music').textContent = 'Показать список';
            this.displayTracksAsEmbed(this.allTracks);
            this.showVpnWarning();
        } else {
            this.currentMusicView = 'list';
            document.getElementById('view-toggle-music').textContent = 'Показать плееры';
            this.displayTracksAsList(this.allTracks);
        }
    }

    showVpnWarning() {
        const warning = document.getElementById('vpnWarning');
        if (warning) {
            warning.style.display = 'block';
            setTimeout(() => {
                this.closeVpnWarning();
            }, 10000);
        }
    }

    closeVpnWarning() {
        const warning = document.getElementById('vpnWarning');
        if (warning) {
            warning.style.display = 'none';
        }
    }

    searchMusicTracks(query) {
        if (!query) {
            this.displayMusicTracks(this.allTracks);
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const results = this.allTracks.filter(track => 
            track.name.toLowerCase().includes(lowerQuery) || 
            track.artist.toLowerCase().includes(lowerQuery) ||
            track.album.toLowerCase().includes(lowerQuery)
        );
        this.displayMusicTracks(results);
    }

    sortMusicTracks(sortBy) {
        let sortedTracks = [...this.allTracks];
        
        switch(sortBy) {
            case 'alphabet':
                sortedTracks.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'recent':
                sortedTracks.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
                break;
            case 'popular':
                sortedTracks.sort((a, b) => b.popularity - a.popularity);
                break;
            default:
                break;
        }
        
        document.querySelectorAll('#music-content .controls button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`sort-${sortBy}-music`).classList.add('active');
        
        this.displayMusicTracks(sortedTracks);
    }

    // Функции для библиотеки
    displayWritings() {
        const writings = window.writingsData || [];
        const grid = document.getElementById('writings-grid');
        
        if (writings.length === 0) {
            grid.innerHTML = '<div class="no-results">Пока нет записей.</div>';
            return;
        }

        grid.innerHTML = writings.map(writing => `
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
                this.openWritingModal(file, card.querySelector('.writing-name').textContent);
            });
        });
    }

    setupWritingsModal() {
        this.modal = document.getElementById('text-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalText = document.getElementById('modal-text');
        
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closeWritingModal();
        });
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeWritingModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeWritingModal();
            }
        });
    }

    setupBlinkingTitle() {
        const title = document.querySelector('#library-content h2');
        if (title) {
            const originalText = "Мои записи";
            const blinkText = "Мои графоманские потуги";
            
            setInterval(() => {
                if (Math.random() < 0.2) {
                    title.textContent = blinkText;
                    setTimeout(() => {
                        title.textContent = originalText;
                    }, 300);
                }
            }, 2000);
        }
    }

    openWritingModal(file, title) {
        this.modalTitle.textContent = title;
        this.modalText.innerHTML = '<div style="text-align: center; padding: 20px;">Загрузка...</div>';
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        this.loadTextFile(file);
    }

    closeWritingModal() {
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
        // Секретная функция для показа/скрытия аниме (если нужно)
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new RatingsApp();
});