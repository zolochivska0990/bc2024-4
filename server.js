const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const commander = require('commander');
const superagent = require('superagent'); // Додали superagent

// Використання Commander для обробки параметрів командного рядка
const program = new commander.Command();
program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cachePath>', 'Path to cache directory');

program.parse(process.argv);

const { host, port, cache: cacheDir } = program.opts();

// Обробка HTTP запиту
const handleRequest = async (req, res) => {
    const code = req.url.substring(1); // Отримуємо статус-код з URL
    const filePath = path.join(cacheDir, `${code}.jpg`); // Шлях до кешованого файлу

    switch (req.method) {
        case 'GET':
            try {
                // Читаємо картинку з кешу
                const data = await fs.readFile(filePath);
                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                res.end(data);
            } catch {
                // Якщо файлу немає в кеші, завантажуємо його з http.cat
                try {
                    const response = await superagent.get(`https://http.cat/${code}`);
                    await fs.writeFile(filePath, response.body); // Зберігаємо в кеш
                    res.writeHead(200, {'Content-Type': 'image/jpeg'});
                    res.end(response.body);
                } catch {
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.end('Not Found');
                }
            }
            break;

        case 'PUT':
            // Збереження нового файлу в кеші (залишається незмінним)
            let body = [];
            req.on('data', chunk => body.push(chunk));
            req.on('end', async () => {
                body = Buffer.concat(body);
                await fs.writeFile(filePath, body);
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end('Image cached');
            });
            break;

        case 'DELETE':
            // Видалення файлу з кешу (залишається незмінним)
            try {
                await fs.unlink(filePath);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Image deleted');
            } catch (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Image not found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server error');
                }
            }
            break;

        default:
            // Непідтримуваний метод
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method not allowed');
            break;
    }
};

// Створення HTTP сервера
const server = http.createServer(handleRequest);

// Запуск сервера
server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
