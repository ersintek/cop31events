import EmbeddedPostgres from 'embedded-postgres';

const pg = new EmbeddedPostgres({
  databaseDir: './tmp/cop31-postgres', user: 'cop31', password: 'cop31', port: 5434,
  persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], onLog: () => {}, onError: console.error,
});
await pg.initialise();
await pg.start();
await pg.createDatabase('cop31').catch(() => {});
console.log('Local COP31 PostgreSQL is ready on port 5434.');
process.on('SIGINT', async () => { await pg.stop(); process.exit(0); });
process.on('SIGTERM', async () => { await pg.stop(); process.exit(0); });
await new Promise(() => {});
