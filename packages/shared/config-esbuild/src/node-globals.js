import { createRequire } from 'module';
global.require = createRequire(import.meta.url);

// You might also need shims for __filename and __dirname if other errors pop up
// import { fileURLToPath } from 'url';
// global.__filename = fileURLToPath(import.meta.url);
// global.__dirname = dirname(fileURLToPath(import.meta.url));
// import { dirname } from 'path'; // would need path to be available