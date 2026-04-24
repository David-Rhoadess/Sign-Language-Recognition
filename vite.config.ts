import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'database-server',
      configureServer(server) {
        server.middlewares.use('/save-database', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            const dbPath = path.resolve(__dirname, 'src/MappingDatabase.json');
            fs.writeFileSync(dbPath, JSON.stringify(JSON.parse(body), null, 2), 'utf8');
            res.statusCode = 200;
            res.end('ok');
          });
        });
      }
    }
  ],
})
