// Переменная для хранения всех треков
let allTracks = [];
let currentView = 'list'; // 'embed' или 'list' - начинаем со списка

// Функция для извлечения track_id из Spotify URL
function extractTrackId(url) {
    try {
        // Если URL содержит track ID напрямую
        if (url.includes('spotify:track:')) {
            return url.split('spotify:track:')[1];
        }
        // Если это обычная ссылка
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

// Функция для форматирования длительности
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Функция для форматирования общей длительности
function formatTotalDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    }
    return `${minutes} минут`;
}

// Функция для показа предупреждения о VPN
function showVpnWarning() {
    const warning = document.getElementById('vpnWarning');
    warning.style.display = 'block';
    
    // Автоматически скрыть через 10 секунд
    setTimeout(() => {
        closeVpnWarning();
    }, 10000);
}

// Функция для скрытия предупреждения о VPN
function closeVpnWarning() {
    const warning = document.getElementById('vpnWarning');
    warning.style.display = 'none';
}

// Функция для парсинга CSV данных
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    const tracks = [];
    let totalDuration = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Простой парсинг CSV (для более сложных случаев нужна библиотека)
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
        
        // Извлекаем track_id из URL
        const trackId = extractTrackId(values[0] || '');
        const duration = parseInt(values[5]) || 0;
        totalDuration += duration;
        
        // Создаем объект трека
        const track = {
            name: values[1] || 'Неизвестный трек',
            artist: values[3] || 'Неизвестный исполнитель',
            album: values[2] || 'Неизвестный альбом',
            popularity: parseInt(values[6]) || 0,
            explicit: values[7] === 'true',
            releaseDate: values[4] || 'Неизвестная дата',
            duration: duration,
            formattedDuration: formatDuration(duration),
            genres: values[10] || '',
            url: values[0] || '',
            trackId: trackId,
            embedUrl: trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=oembed&theme=0` : null
        };
        
        tracks.push(track);
    }
    
    // Обновляем статистику общей длительности
    document.getElementById('total-duration').textContent = formatTotalDuration(totalDuration);
    
    return tracks;
}

// Функция для загрузки CSV файла
async function loadCSVFile() {
    try {
        const response = await fetch('Liked_Songs.csv');
        if (!response.ok) {
            throw new Error(`Ошибка загрузки файла: ${response.status}`);
        }
        
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Ошибка загрузки CSV файла:', error);
        document.getElementById('loading-message').textContent = 'Ошибка загрузки файла Liked_Songs.csv';
        return [];
    }
}

// Функция для отображения треков в виде embed
function displayTracksAsEmbed(tracksToDisplay) {
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

// Функция для отображения треков в виде списка
function displayTracksAsList(tracksToDisplay) {
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

// Функция для переключения вида
function toggleView() {
    if (currentView === 'list') {
        // Переключаемся на embed и показываем предупреждение
        currentView = 'embed';
        document.getElementById('view-toggle').textContent = 'Показать список';
        displayTracksAsEmbed(allTracks);
        showVpnWarning();
    } else {
        // Переключаемся на список
        currentView = 'list';
        document.getElementById('view-toggle').textContent = 'Показать плееры';
        displayTracksAsList(allTracks);
    }
}

// Функция для отображения треков (основная)
function displayTracks(tracksToDisplay) {
    if (currentView === 'embed') {
        displayTracksAsEmbed(tracksToDisplay);
    } else {
        displayTracksAsList(tracksToDisplay);
    }
}

// Функция для обновления статистики
function updateStats(tracks) {
    document.getElementById('total-tracks').textContent = tracks.length;
    
    // Подсчет уникальных исполнителей
    const artists = new Set();
    tracks.forEach(track => {
        track.artist.split(';').forEach(artist => artists.add(artist.trim()));
    });
    document.getElementById('unique-artists').textContent = artists.size;
    
    // Подсчет треков с Explicit
    const explicitCount = tracks.filter(track => track.explicit).length;
    document.getElementById('explicit-count').textContent = explicitCount;
}

// Функция для поиска треков
function searchTracks(query) {
    if (!query) return allTracks;
    
    const lowerQuery = query.toLowerCase();
    return allTracks.filter(track => 
        track.name.toLowerCase().includes(lowerQuery) || 
        track.artist.toLowerCase().includes(lowerQuery) ||
        track.album.toLowerCase().includes(lowerQuery)
    );
}

// Функция для сортировки треков
function sortTracks(sortBy, tracksToSort) {
    const sortedTracks = [...tracksToSort];
    
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
    
    return sortedTracks;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем данные из CSV файла
    const loadingMessage = document.getElementById('loading-message');
    loadingMessage.textContent = 'Загрузка данных из CSV файла...';
    
    allTracks = await loadCSVFile();
    
    if (allTracks.length > 0) {
        loadingMessage.style.display = 'none';
        
        updateStats(allTracks);
        // Начинаем с отображения списка
        displayTracksAsList(allTracks);
        
        // Обработчики событий для кнопок
        document.getElementById('sort-alphabet').addEventListener('click', () => {
            const sorted = sortTracks('alphabet', allTracks);
            displayTracks(sorted);
            document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            document.getElementById('sort-alphabet').classList.add('active');
        });
        
        document.getElementById('sort-recent').addEventListener('click', () => {
            const sorted = sortTracks('recent', allTracks);
            displayTracks(sorted);
            document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            document.getElementById('sort-recent').classList.add('active');
        });
        
        document.getElementById('sort-popular').addEventListener('click', () => {
            const sorted = sortTracks('popular', allTracks);
            displayTracks(sorted);
            document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            document.getElementById('sort-popular').classList.add('active');
        });
        
        // Обработчик для переключения вида
        document.getElementById('view-toggle').addEventListener('click', toggleView);
        
        // Обработчик для закрытия предупреждения VPN
        document.getElementById('vpnWarningClose').addEventListener('click', closeVpnWarning);
        
        // Обработчик для поиска
        document.getElementById('search-input').addEventListener('input', (e) => {
            const query = e.target.value;
            const results = searchTracks(query);
            displayTracks(results);
        });
    }
});