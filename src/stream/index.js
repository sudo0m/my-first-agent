import http from 'node:http';

function toSsePayload(event) {
    const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
    return [
        `event: ${event.type}`,
        `data: ${data}`,
        '',
        ''
    ].join('\n');
}

export function createStreamHub() {
    const subscribers = new Set();
    const history = [];

    return {
        publish(event) {
            const normalizedEvent = {
                type: event.type || 'message',
                data: event.data ?? null,
                at: new Date().toISOString()
            };

            history.push(normalizedEvent);
            if (history.length > 100) {
                history.shift();
            }

            for (const subscriber of subscribers) {
                subscriber.write(toSsePayload(normalizedEvent));
            }
        },
        subscribe(res) {
            subscribers.add(res);
            res.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no'
            });
            res.write('\n');
            for (const event of history) {
                res.write(toSsePayload(event));
            }

            return () => {
                subscribers.delete(res);
            };
        }
    };
}

export function createSseServer({ port = 8787, hub = createStreamHub() } = {}) {
    const server = http.createServer((req, res) => {
        if (req.url === '/events') {
            const unsubscribe = hub.subscribe(res);
            req.on('close', unsubscribe);
            return;
        }

        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true }));
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'not found' }));
    });

    return {
        hub,
        start() {
            return new Promise((resolve) => {
                server.listen(port, () => resolve({ port }));
            });
        },
        close() {
            return new Promise((resolve) => server.close(resolve));
        }
    };
}
