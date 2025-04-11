// server.ts
import express from 'express';
import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import fetch from 'node-fetch';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT || '3000', 10);
const previewServerPort = parseInt(process.env.PREVIEW_SERVER_PORT || '3001', 10);
const previewServerUrl = `http://localhost:${previewServerPort}`;

app.prepare().then(() => {
    const app = express();

    // Proxy requests to the preview server's endpoints
    app.post('/v2/registry/docs/load-with-url', async (req, res) => {
        try {
            console.log("Fego in the bundle server")
            const response = await fetch(`${previewServerUrl}/v2/registry/docs/load-with-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...req.headers as any
                },
                body: JSON.stringify(req.body)
            });

            const data = await response.json();
            res.json(data);
        } catch (error) {
            console.error('Error fetching docs from preview server:', error);
            res.status(500).json({ error: 'Failed to fetch docs definition' });
        }
    });

    app.get('/api/metadata', (_, res) => {
        res.json({
            domain: "localhost",
            basePath: "/docs",
            url: `http://localhost:${port}/docs`,
            org: "Local Preview",
            isPreview: true,
        });
    });

    // WebSocket upgrade handling
    app.get('/_next/webpack-hmr', (req, res, next) => {
        if (req.headers.upgrade === 'websocket') {
            // Pass through WebSocket connection
            res.writeHead(400);
            res.end();
            return;
        }
        next();
    });

    app.all('*', (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    createServer(app).listen(port, (err?: any) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
        console.log(`> Using preview server at ${previewServerUrl}`);
    });
});