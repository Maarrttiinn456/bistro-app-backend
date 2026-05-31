import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

app.listen({ port: 3000 }, function (err, address) {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server is now listening on ${address}`);
});
