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

        window.scrollTo({
            top: 0
        });
        
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
                
                <!-- Кнопка скачивания в правом нижнем углу карточки -->
                <div class="writing-actions">
                    <a href="writedata/${writing.file}" download class="download-corner-btn" onclick="event.stopPropagation()" title="Скачать файл">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

        document.querySelectorAll('.writing-card').forEach(card => {
            card.addEventListener('click', () => {
                const file = card.getAttribute('data-file');
                this.openWritingModal(file, card.querySelector('.writing-name').textContent);
            });
        });
    }

    openWritingModal(file, title) {
        const fileExtension = file.split('.').pop().toLowerCase();
        
        if (fileExtension === 'rtf') {
            this.openRTFInNewTab(file, title);
        } else {
            this.openTextInNewTab(file, title);
        }
    }

    openRTFInNewTab(file, title) {
        const timestamp = new Date().getTime();
        const filePath = `writedata/${file}?v=${timestamp}`;
        
        fetch(filePath, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Файл не найден');
            return response.text();
        })
        .then(rtfContent => {
            const htmlContent = this.convertRTFtoHTML(rtfContent, title, file);
            this.openHTMLInNewTab(htmlContent, title);
        })
        .catch(error => {
            console.error('Ошибка загрузки RTF файла:', error);
            this.showErrorInNewTab(file, title, error.message);
        });
    }

    // Метод для открытия текстовых файлов в новой вкладке
    openTextInNewTab(file, title) {
        const filePath = `writedata/${file}`;
        
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Файл не найден');
                }
                return response.text();
            })
            .then(textContent => {
                const htmlContent = this.convertTextToHTML(textContent, title);
                this.openHTMLInNewTab(htmlContent, title);
            })
            .catch(error => {
                console.error('Ошибка загрузки файла:', error);
                this.showErrorInNewTab(file, title, error.message);
            });
    }

    // Улучшенный конвертер RTF в HTML с кликабельной ссылкой для скачивания
    convertRTFtoHTML(rtfText, title, fileName) {
        let html = rtfText
            .replace(/\\rtf1.*?\\uc0\\pard\\plain/g, '')
            .replace(/\\par\s*/g, '<br>')
            .replace(/\\tab\s*/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/[{}]/g, '')
            .replace(/\\[a-z]+\d*\s*/g, '')
            .replace(/(<br>\s*){2,}/g, '</p><p>')
            .trim();

        if (html && !html.startsWith('<p>')) {
            html = `<p>${html}</p>`;
        }

        // Создаем кликабельную ссылку для скачивания
        const downloadLink = `<a href="writedata/${fileName}" download style="color: #bd93f9; text-decoration: none; font-weight: 600; border-bottom: 1px dashed #bd93f9; transition: all 0.3s ease;" onmouseover="this.style.color='#ff79c6'; this.style.borderBottomColor='#ff79c6'" onmouseout="this.style.color='#bd93f9'; this.style.borderBottomColor='#bd93f9'">скачать сам файл</a>`;

        return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #f8f8f2;
                padding: 0;
                margin: 0;
            }
            
            .writing-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
                background: white;
                min-height: 100vh;
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
            }
            
            .writing-header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #bd93f9;
            }
            
            .writing-title {
                font-size: 2.5rem;
                color: #282a36;
                margin-bottom: 10px;
                font-weight: 700;
            }
            
            .writing-meta {
                color: #6272a4;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .writing-content {
                font-size: 1.1rem;
                color: #44475a;
            }
            
            .writing-content p {
                margin-bottom: 1.5em;
                text-align: justify;
            }
            
            .writing-content br {
                margin-bottom: 0.5em;
            }
            
            .back-button {
                display: inline-block;
                background: #bd93f9;
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 30px;
                transition: all 0.3s ease;
            }
            
            .back-button:hover {
                background: #a56ef1;
                transform: translateY(-2px);
            }

            /* Стили для ссылки скачивания в тексте */
            .download-text-link {
                color: #bd93f9;
                text-decoration: none;
                font-weight: 600;
                border-bottom: 1px dashed #bd93f9;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .download-text-link:hover {
                color: #ff79c6;
                border-bottom-color: #ff79c6;
            }
            
            @media (max-width: 768px) {
                .writing-container {
                    padding: 20px 15px;
                }
                
                .writing-title {
                    font-size: 2rem;
                }
                
                .writing-content {
                    font-size: 1rem;
                }

                .writing-meta {
                    font-size: 0.85rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="writing-container">
            <div class="writing-header">
                <h1 class="writing-title">${title}</h1>
                <div class="writing-meta">
                    Форматирование может быть искажено. Если есть желание прочитать полностью, рекомендуется ${downloadLink}*
                </div>
            </div>
            
            <div class="writing-content">
                ${html || '<p style="text-align: center; color: #888;">Файл пуст или не может быть отображен</p>'}
            </div>
            
            <div style="text-align: center;">
                <a href="javascript:window.close()" class="back-button">Закрыть вкладку</a>
            </div>
        </div>
    </body>
    </html>`;
    }

    // Конвертер для текстовых файлов
    convertTextToHTML(textContent, title) {
        const formattedText = textContent
            .replace(/\n/g, '<br>')
            .replace(/(<br>\s*){2,}/g, '</p><p>');

        const html = textContent && !textContent.startsWith('<p>') ? 
            `<p>${formattedText}</p>` : formattedText;

        return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            /* Тот же CSS что и выше */
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f8f8f2; }
            .writing-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; background: white; min-height: 100vh; box-shadow: 0 0 30px rgba(0,0,0,0.1); }
            .writing-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #bd93f9; }
            .writing-title { font-size: 2.5rem; color: #282a36; margin-bottom: 10px; font-weight: 700; }
            .writing-meta { color: #6272a4; font-size: 0.9rem; }
            .writing-content { font-size: 1.1rem; color: #44475a; }
            .writing-content p { margin-bottom: 1.5em; text-align: justify; }
            .back-button { display: inline-block; background: #bd93f9; color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-weight: 600; margin-top: 30px; transition: all 0.3s ease; }
            .back-button:hover { background: #a56ef1; transform: translateY(-2px); }
            @media (max-width: 768px) { .writing-container { padding: 20px 15px; } .writing-title { font-size: 2rem; } .writing-content { font-size: 1rem; } }
        </style>
    </head>
    <body>
        <div class="writing-container">
            <div class="writing-header">
                <h1 class="writing-title">${title}</h1>
                <div class="writing-meta">Из библиотеки Phrenzye</div>
            </div>
            
            <div class="writing-content">
                ${html || '<p style="text-align: center; color: #888;">Файл пуст</p>'}
            </div>
            
            <div style="text-align: center;">
                <a href="javascript:window.close()" class="back-button">Закрыть вкладку</a>
            </div>
        </div>
    </body>
    </html>`;
    }

    // Метод для открытия HTML в новой вкладке
    openHTMLInNewTab(htmlContent, title) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // Освобождаем URL когда вкладка закроется
        if (newWindow) {
            newWindow.addEventListener('beforeunload', () => {
                URL.revokeObjectURL(url);
            });
        }
    }

    // Метод для показа ошибок в новой вкладке
    showErrorInNewTab(file, title, errorMessage) {
        const errorHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ошибка - ${title}</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f8f8f2; color: #333; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .error-container { text-align: center; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .error-icon { font-size: 4rem; margin-bottom: 20px; }
            .error-title { color: #ff5555; margin-bottom: 15px; }
            .error-message { color: #666; margin-bottom: 25px; }
            .button { display: inline-block; background: #bd93f9; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h2 class="error-title">Ошибка загрузки</h2>
            <p class="error-message">${errorMessage}</p>
            <div>
                <a href="writedata/${file}" download class="button">Скачать файл</a>
                <a href="javascript:window.close()" class="button">Закрыть</a>
            </div>
        </div>
    </body>
    </html>`;
        
        this.openHTMLInNewTab(errorHTML, `Ошибка - ${title}`);
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