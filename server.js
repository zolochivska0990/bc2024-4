const http = require('http');
const fs = require('fs').promises; // Використовуємо проміси для асинхронних функцій
const superagent = require('superagent');
const path = require('path');

// Параметри сервера
const host = 'localhost'; // або інший хост
const port = 4000; // порт, на якому буде слухати сервер
const cacheDir = './cache'; // директорія для кешу

// Створення кешу, якщо його не існує
fs.mkdir(cacheDir, { recursive: true }).catch(console.error);

// Обробка HTTP запитів
const handleRequest = async (req, res) => {
    const code = req.url.substring(1); // Витягуємо код з URL
    const filePath = path.join(cacheDir, `${code}.jpg`); // Шлях до кешованого файлу

    switch (req.method) {
        case 'GET':
            try {
                const data = await fs.readFile(filePath); // Спробуємо прочитати файл з кешу
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(data);
            } catch {
                // Якщо файл не знайдено, звертаємось до http.cat
                try {
                    const response = await superagent.get(`https://http.cat/${code}`);
                    await fs.writeFile(filePath, response.body); // Зберігаємо картинку в кеш
                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(response.body);
                } catch {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            }
            break;

        case 'PUT':
            // Обробка запиту PUT для збереження картинки
            let body = [];
            req.on('data', chunk => body.push(chunk)); // Збираємо дані з запиту
            req.on('end', async () => {
                const imageData = Buffer.concat(body);
                await fs.writeFile(filePath, imageData); // Записуємо картинку в кеш
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Image saved');
            });
            break;

        case 'DELETE':
            // Обробка запиту DELETE для видалення картинки
            try {
                await fs.unlink(filePath); // Видаляємо файл з кешу
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Image deleted');
            } catch {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            break;

        default:
            // Якщо метод не підтримується
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
            break;
    }
};

// Створення сервера
const server = http.createServer(handleRequest);

// Запуск сервера
server.listen(port, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
