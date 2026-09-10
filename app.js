// Основное приложение
class RatingsApp {
    constructor() {
        this.currentTab = 'about';
        this.currentSort = 'date';
        this.searchQuery = '';
        this.currentMusicView = 'list';
        this.allTracks = [];
        this.isDarkTheme = true;
        this.previewAudio = new Audio();
        this.currentPreviewButton = null;
        this.currentArtworkIndex = null;
        this.previewAudio.addEventListener('ended', () => {
            if (this.currentPreviewButton) {
                this.currentPreviewButton.innerHTML = '<i data-lucide="play"></i>';
                lucide.createIcons();
                this.currentPreviewButton = null;
            }
        });
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.handleHashNavigation();
        this.initTabIndicator();
        this.loadThemePreference();
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.applyTheme();
        this.saveThemePreference();
    }

    applyTheme() {
        const theme = this.isDarkTheme ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            favicon.href = this.isDarkTheme ? 'favicon.png' : 'faviconsun.png';
        }
        // Аватары переключаются через CSS (.theme-dark-only / .theme-light-only)
        // если в HTML два img; иначе fallback:
        document.querySelectorAll('.hero-avatar img').forEach((img, i) => {
            if (img.classList.contains('theme-dark-only') || img.classList.contains('theme-light-only')) return;
            img.src = this.isDarkTheme ? 'rose.png' : 'rosesun.png';
        });
    }

    saveThemePreference() {
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.isDarkTheme = savedTheme === 'dark';
        } else {
            this.isDarkTheme = true;
        }
        this.applyTheme();
    }

    setupEventListeners() {
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        // Обработчики табов (sidebar + любые .tab / .nav-btn)
        document.querySelectorAll('.tab, .nav-btn[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const el = e.currentTarget;
                const tabName = el.getAttribute('data-tab');
                if (tabName) this.switchTab(tabName);
            });
        });

        // Обработчики сортировки для игр, фильмов, сериалов, аниме
        ['games', 'movies', 'series', 'anime'].forEach(type => { // Добавили 'anime'
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
        ['games', 'movies', 'series', 'anime'].forEach(type => { // Добавили 'anime'
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

        // Кнопка открытия окна
        document.getElementById('upload-csv-btn')?.addEventListener('click', () => {
          document.getElementById('csvModal').style.display = 'block';
        });

        // Кнопка закрытия
        document.getElementById('closeCsvModal')?.addEventListener('click', () => {
          document.getElementById('csvModal').style.display = 'none';
        });

        // Кнопка выбора файла
        document.getElementById('csvUploadBtn')?.addEventListener('click', () => {
          document.getElementById('user-csv-input').click();
        });

        document.getElementById('matchNotificationClose')?.addEventListener('click', () => {
            this.closeMatchNotification();
        });

        // Обработка выбора файла
        document.getElementById('user-csv-input')?.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) this.handleUserCSVUpload(file);
          document.getElementById('csvModal').style.display = 'none';
        });

        // Drag & Drop
        const dropZone = document.getElementById('csvDropZone');
        const dropMsg = document.getElementById('csvDropMessage');

        if (dropZone) {
          dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
            dropMsg.style.display = 'block';
          });

          dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            dropMsg.style.display = 'none';
          });

          dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            dropMsg.style.display = 'none';
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.csv')) {
              this.handleUserCSVUpload(file);
              document.getElementById('csvModal').style.display = 'none';
            } else {
              alert('Пожалуйста, загрузите файл формата CSV.');
            }
          });
        }

        document.getElementById('show-matches-btn')?.addEventListener('click', () => {
            this.toggleShowMatches();
        });


        // Обработчик для закрытия предупреждения VPN
        document.getElementById('vpnWarningClose')?.addEventListener('click', () => {
            this.closeVpnWarning();
        });

        window.addEventListener('hashchange', () => {
            this.handleHashNavigation();
        });

        document.addEventListener('click', (e) => {
            const button = e.target.closest('.release-play-btn');

            if (!button) return;

            const wrapper = button.closest('.release-cover-wrapper');
            const preview = wrapper?.dataset.preview;

            if (!preview) return;

            this.toggleReleasePreview(preview, button);
        });

        document.querySelectorAll('.about-project[data-tab]').forEach(project => {
            project.addEventListener('click', () => {
                const tab = project.dataset.tab;

                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        document.querySelector('.artwork-lightbox-close')?.addEventListener('click', () => {
            this.closeArtwork();
        });

        document.getElementById('artwork-lightbox')?.addEventListener('click', (e) => {
            if (e.target.id === 'artwork-lightbox') {
                this.closeArtwork();
            }
        });
    }

    // Новый метод для обработки навигации по хешу
    handleHashNavigation() {
        const hash = window.location.hash.substring(1); // Убираем # из хеша
        
        if (hash && this.isValidTab(hash)) {
            // Если хеш соответствует существующей вкладке, переключаемся на неё
            this.switchTab(hash);
        } else {
            this.switchTab('about');
        }
    }

    // Метод для проверки валидности имени вкладки
    isValidTab(tabName) {
        const validTabs = ['about', 'games', 'movies', 'series', 'anime', 'music', 'library', 'musician', 'artist'];
        return validTabs.includes(tabName);
    }

    // Обновляем метод switchTab для поддержки хеша
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Обновляем URL с хешем
        window.location.hash = tabName;
        
        // Обновляем активные табы
        document.querySelectorAll('.tab, .nav-btn[data-tab]').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
        
        document.querySelectorAll(`.tab[data-tab="${tabName}"], .nav-btn[data-tab="${tabName}"]`).forEach(el => el.classList.add('active'));
        const panel = document.getElementById(`${tabName}-content`);
        if (panel) panel.classList.add('active');
        
        this.updateTabIndicator();

        window.scrollTo({
            top: 0
        });
        
        // Загружаем контент для соответствующей вкладки
        if (['games', 'movies', 'series', 'anime'].includes(tabName)) {
            this.filterAndDisplayContent(tabName);
        } else if (tabName === 'music') {
            this.loadMusicData();
        } else if (tabName === 'artist') {
            this.displayArtworks();
        } else if (tabName === 'library') {
            this.displayWritings();
        } else if (tabName === 'musician') {
            this.displayReleases();
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

    // Рисование

    displayArtworks() {
        const container = document.getElementById('artworks-grid');

        if (!container) return;

        const artworks = window.artworksData || [];

        if (artworks.length === 0) {
            container.innerHTML = '<div class="no-results">Работ пока нет.</div>';
            return;
        }

        container.innerHTML = artworks.map((artwork, index) => `
            <article class="artwork-card" data-artwork-index="${index}">
                <div class="artwork-image-wrapper">
                    <div
                        class="artwork-image-background"
                        style="background-image: url('${artwork.image}')"
                    ></div>

                    <img
                        src="${artwork.image}"
                        alt="${artwork.title}"
                        class="artwork-image"
                        loading="lazy"
                    >

                    <div class="artwork-open-hint">
                        <i data-lucide="maximize-2"></i>
                    </div>
                </div>

                <div class="artwork-info">
                    <span class="artwork-title">${artwork.title}</span>
                    <span class="artwork-rating">${artwork.rating}</span>
                </div>
            </article>
        `).join('');

        lucide.createIcons();

        container.querySelectorAll('.artwork-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = Number(card.dataset.artworkIndex);
                this.openArtwork(index);
            });
        });
    }

    openArtwork(index) {
        const artwork = window.artworksData?.[index];

        if (!artwork) return;

        this.currentArtworkIndex = index;

        const lightbox = document.getElementById('artwork-lightbox');
        const image = document.getElementById('artwork-lightbox-image');
        const title = document.getElementById('artwork-lightbox-title');

        image.src = artwork.image;
        image.alt = artwork.title;

        title.textContent = `${artwork.title} · ${artwork.rating}`;

        lightbox.classList.add('active');
        document.body.classList.add('lightbox-open');
    }

    closeArtwork() {
        const lightbox = document.getElementById('artwork-lightbox');

        lightbox.classList.remove('active');
        document.body.classList.remove('lightbox-open');

        this.currentArtworkIndex = null;
    }

    // Музыкальные функции
    displayReleases() {
        const container = document.getElementById('releases-grid');

        if (!container) return;

        const releases = window.releasesData || [];

        if (releases.length === 0) {
            container.innerHTML = '<div class="no-results">Релизов пока нет.</div>';
            return;
        }

        container.innerHTML = releases.map(release => `
            <article class="release-card">

                <div class="release-info">

                    <div class="release-cover-wrapper" data-preview="${release.preview || ''}">
                        <img
                            src="${release.cover}"
                            alt="${release.title}"
                            class="release-cover"
                            loading="lazy"
                        >

                        <div class="release-cover-overlay">
                            <button class="release-play-btn" type="button" aria-label="Прослушать">
                                <i data-lucide="play"></i>
                            </button>
                        </div>
                    </div>

                    <div class="release-meta">
                        <h3>${release.title}</h3>

                        <span>${release.genre}</span>
                        <span>${release.type}</span>
                        <span>${release.date}</span>
                    </div>

                </div>

                <div class="release-tracks">

                    <div class="release-tracks-title">
                        Треклист
                    </div>

                    ${release.tracks.map((track, index) => `
                        <div class="release-track">
                            <span class="track-number">
                                ${String(index + 1).padStart(2, '0')}
                            </span>

                            <span class="track-title">
                                ${track.title}
                            </span>

                            <span class="track-duration">
                                ${track.duration || ''}
                            </span>
                        </div>
                    `).join('')}

                    <div class="release-links">

                        ${release.links.spotify ? `
                            <a href="${release.links.spotify}" target="_blank" rel="noopener noreferrer">
                                Spotify
                            </a>
                        ` : ''}

                        ${release.links.youtube ? `
                            <a href="${release.links.youtube}" target="_blank" rel="noopener noreferrer">
                                YouTube
                            </a>
                        ` : ''}

                        ${release.links.yandex ? `
                            <a href="${release.links.yandex}" target="_blank" rel="noopener noreferrer">
                                Яндекс Музыка
                            </a>
                        ` : ''}

                    </div>

                </div>

            </article>
        `).join('');
    }

    toggleReleasePreview(preview, button) {
        if (this.currentPreviewButton === button) {
            if (this.previewAudio.paused) {
                this.previewAudio.play();
                button.innerHTML = '<i data-lucide="pause"></i>';
            } else {
                this.previewAudio.pause();
                button.innerHTML = '<i data-lucide="play"></i>';
            }

            lucide.createIcons();
            return;
        }

        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;

        if (this.currentPreviewButton) {
            this.currentPreviewButton.innerHTML = '<i data-lucide="play"></i>';
        }

        this.previewAudio.src = preview;
        this.currentPreviewButton = button;

        this.previewAudio.play();

        button.innerHTML = '<i data-lucide="pause"></i>';
        lucide.createIcons();
    }

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

        if (this.matchedTracks?.length) {
            this.highlightMatches(this.matchedTracks);
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
			        <img src="covers/${track.trackId}.jpg" 
			             class="track-cover"
			             onerror="
			                 if (this.src.includes('covers/')) {
			                     this.src = 'covers2/${track.trackId}.jpg';
			                 } else if (this.src.includes('covers2/')) {
			                     this.src = 'placeholder-cover.png';
			                     this.onerror = null;
			                 }
			             ">
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

    showMatchNotification(count) {
        const notif = document.getElementById('matchNotification');
        const text = document.getElementById('matchNotificationText');
        if (!notif || !text) return;

        text.textContent = `Найдено совпадений: ${count}`;
        notif.style.display = 'block';
        notif.classList.add('visible');

        clearTimeout(this.matchNotifTimeout);
        this.matchNotifTimeout = setTimeout(() => {
            this.closeMatchNotification();
        }, 6000);
    }

    closeMatchNotification() {
        const notif = document.getElementById('matchNotification');
        if (notif) {
            notif.classList.remove('visible');
            setTimeout(() => (notif.style.display = 'none'), 300);
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

    // Обработка пользовательского CSV
    async handleUserCSVUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            const userTracks = this.parseCSV(csvText);

            // Сравнение по названию и исполнителю
            const matches = this.allTracks.filter(track => {
                return userTracks.some(userTrack =>
                    userTrack.name.trim().toLowerCase() === track.name.trim().toLowerCase() &&
                    userTrack.artist.trim().toLowerCase() === track.artist.trim().toLowerCase()
                );
            });

            // Подсветка совпадений
            this.highlightMatches(matches);
            this.matchedTracks = matches;
            document.getElementById('show-matches-btn').style.display = 'inline-block';
            this.showMatchNotification(matches.length);
        };
        reader.readAsText(file);
    }

    highlightMatches(matches) {
        const container = document.getElementById('tracks-container');
        const items = container.querySelectorAll('.track-item, .embed-card, .no-embed');
        items.forEach(el => {
            const name = el.querySelector('.track-name')?.textContent?.trim().toLowerCase();
            const artist = el.querySelector('.artist-name')?.textContent?.trim().toLowerCase();
            const isMatch = matches.some(m => 
                m.name.trim().toLowerCase() === name &&
                m.artist.trim().toLowerCase() === artist
            );
            if (isMatch) {
                el.classList.add('match-highlight');
            } else {
                el.classList.remove('match-highlight');
            }
        });
    }

    toggleShowMatches() {
        const btn = document.getElementById('show-matches-btn');
        const showingOnly = btn.classList.toggle('active');
        if (showingOnly) {
            this.displayMusicTracks(this.matchedTracks || []);
            btn.textContent = 'Показать все треки';
        } else {
            this.displayMusicTracks(this.allTracks);
            btn.textContent = 'Показать только совпадения';
        }

        if (this.matchedTracks?.length) {
            this.highlightMatches(this.matchedTracks);
        }
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
        <div class="writing-card" data-url="${writing.url}">
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

        document.querySelectorAll('.writing-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.getAttribute('data-url');
                if (url) {
                    window.open(url, '_blank', 'noopener');
                }
            });
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
    lucide.createIcons();
});