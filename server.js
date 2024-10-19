const fs = require('fs').promises;
const path = require('path');

const cacheDir = options.cache;

const handleRequest = async (req, res) => {
    const code = req.url.substring(1); // отримати код з URL

    switch (req.method) {
        case 'GET':
            try {
                const filePath = path.join(cacheDir, `${code}.jpg`);
                const data = await fs.readFile(filePath);
                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                res.end(data);
            } catch (error) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found');
            }
            break;

        case 'PUT':
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const filePath = path.join(cacheDir, `${code}.jpg`);
                await fs.writeFile(filePath, buffer);
                res.writeHead(201, {'Content-Type': 'text/plain'});
                res.end('Created');
            });
            break;

        case 'DELETE':
            try {
                const filePath = path.join(cacheDir, `${code}.jpg`);
                await fs.unlink(filePath);
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('Deleted');
            } catch (error) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found');
            }
            break;

        default:
            res.writeHead(405, {'Content-Type': 'text/plain'});
            res.end('Method not allowed');
            break;
    }
};

const server = http.createServer(handleRequest);
