// НАСТРОЙКА БАЗЫ ДАННЫХ (IndexedDB)
const DB_NAME = 'PulseQuantumDB';
const DB_VERSION = 1;
const STORE_NAME = 'focus_logs';
let db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (e) => reject('Ошибка БД: ' + e.target.error);
        
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        // Создаем структуру, если БД запускается впервые
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
function addLog(indexValue, noteText) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const logEntry = {
            index: indexValue,
            note: noteText,
            timestamp: new Date().toLocaleString('ru-RU')
        };

        const request = store.add(logEntry);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

function getAllLogs() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll(); // Получаем все записи массива

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function clearAllLogs() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

// ЛОГИКА ДЛЯ СТРАНИЦЫ ТЕРМИНАЛА (index.html)
function runTerminalPage() {
    const actionBtn = document.getElementById('action-btn');
    const focusIndex = document.getElementById('focus-index');
    let interval = null;

    actionBtn.addEventListener('click', () => {
        if (interval) clearInterval(interval);

        actionBtn.innerText = 'Синхронизация...';
        
        let currentTarget = 0;
        const targetValue = Math.floor(Math.random() * (99 - 75 + 1)) + 75;

        interval = setInterval(async () => {
            if (currentTarget >= targetValue) {
                clearInterval(interval);
                actionBtn.innerText = 'Записано в БД';
                
                // Автоматически пишем сгенерированный лог в IndexedDB
                try {
                    await addLog(targetValue, "Автоматическое сканирование импульса");
                } catch (err) {
                    console.error("Квантовый сбой записи:", err);
                }
                
                setTimeout(() => { actionBtn.innerText = 'Запустить симуляцию'; }, 3000);
            } else {
                currentTarget++;
                focusIndex.innerText = `${currentTarget.toString().padStart(2, '0')}%`;
            }
        }, 15);
    });
}

// ЛОГИКА ДЛЯ СТРАНИЦЫ АРХИВА (logs.html)
async function runLogsPage() {
    const logsContainer = document.getElementById('logs-container');
    const addForm = document.getElementById('add-log-form');
    const clearBtn = document.getElementById('clear-db-btn');

    // Функция отрисовки карточек из БД
    async function renderLogs() {
        try {
            const logs = await getAllLogs();
            if (logs.length === 0) {
                logsContainer.innerHTML = '<div class="loading-status">Архив пуст. Нет сохраненных квантовых сигналов.</div>';
                return;
            }

            // Переворачиваем массив, чтобы новые записи были сверху
            logsContainer.innerHTML = logs.reverse().map(log => `
                <div class="log-card">
                    <div class="log-meta">
                        <span class="log-date">[ ${log.timestamp} ]</span>
                        <span class="log-note">${log.note}</span>
                    </div>
                    <div class="log-value">${log.index}%</div>
                </div>
            `).join('');
        } catch (err) {
            logsContainer.innerHTML = `<div class="loading-status" style="color: red;">Ошибка чтения: ${err}</div>`;
        }
    }

    // Слушатель отправки ручной формы
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const indexInput = document.getElementById('manual-index');
        const noteInput = document.getElementById('manual-note');

        try {
            await addLog(parseInt(indexInput.value), noteInput.value);
            indexInput.value = '';
            noteInput.value = '';
            renderLogs(); // Перерисовываем список
        } catch (err) {
            alert('Сбой добавления: ' + err);
        }
    });

    // Очистка всей базы данных
    clearBtn.addEventListener('click', async () => {
        if (confirm('Внимание: Вы уверены, что хотите стереть квантовую память архива?')) {
            await clearAllLogs();
            renderLogs();
        }
    });

    // Первая инициализация списка при входе на страницу
    renderLogs();
}

// ТОЧКА ВХОДА: Инициализируем БД, затем смотрим, где мы находимся
initDB().then(() => {
    if (document.getElementById('action-btn')) {
        runTerminalPage();
    }
    if (document.getElementById('logs-container')) {
        runLogsPage();
    }
}).catch(err => {
    console.error("Критическая ошибка инициализации хранилища:", err);
});