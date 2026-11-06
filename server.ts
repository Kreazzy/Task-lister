import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_SECTIONS_CONFIG, DEFAULT_MASTER_TASKS, DEFAULT_USERS, DEFAULT_SLA_MILESTONES, DEFAULT_ROLE_DEFINITIONS } from './src/data/defaultData.ts';

const ROOT_DIR = process.cwd();
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_DIR = path.resolve(ROOT_DIR, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial default database structure
const DEFAULT_APP_SETTINGS = {
  theme: 'bank-blue',
  density: 'comfortable',
  layoutFormat: 'sections',
  portalTitle: 'Soneri Bank Limited',
  portalSubtitle: 'IT Operation Task List - Operational Dashboard',
};

function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading db.json, generating defaults', err);
  }

  // Seed default data if file does not exist
  const initialDb = {
    sectionsConfig: DEFAULT_SECTIONS_CONFIG,
    tasksMaster: DEFAULT_MASTER_TASKS,
    slaMilestones: DEFAULT_SLA_MILESTONES,
    historyDB: {},
    usersDB: DEFAULT_USERS,
    rolesDB: DEFAULT_ROLE_DEFINITIONS,
    appSettings: DEFAULT_APP_SETTINGS,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial db.json', err);
  }

  return initialDb;
}

function writeDatabase(data: any) {
  try {
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json', err);
    return false;
  }
}

app.use(express.json({ limit: '15mb' }));

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET all application data
app.get('/api/data', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db);
});

// POST sync application data
app.post('/api/sync', (req: Request, res: Response) => {
  const incoming = req.body;
  const currentDb = readDatabase();

  const mergedDb = {
    sectionsConfig: incoming.sectionsConfig || currentDb.sectionsConfig,
    tasksMaster: incoming.tasksMaster || currentDb.tasksMaster,
    slaMilestones: incoming.slaMilestones || currentDb.slaMilestones,
    historyDB: incoming.historyDB ? { ...currentDb.historyDB, ...incoming.historyDB } : currentDb.historyDB,
    usersDB: incoming.usersDB || currentDb.usersDB,
    rolesDB: incoming.rolesDB || currentDb.rolesDB || DEFAULT_ROLE_DEFINITIONS,
    appSettings: incoming.appSettings ? { ...currentDb.appSettings, ...incoming.appSettings } : currentDb.appSettings,
  };

  const success = writeDatabase(mergedDb);
  res.json({ success, updatedAt: new Date().toISOString(), data: mergedDb });
});

// Specialized atomic reorder task endpoint
app.post('/api/tasks/reorder', (req: Request, res: Response) => {
  const { sectionKey, fromIndex, toIndex } = req.body;
  const currentDb = readDatabase();
  const tasksMaster = { ...currentDb.tasksMaster };

  const list = tasksMaster[sectionKey] ? [...tasksMaster[sectionKey]] : [];
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return res.status(400).json({ error: 'Invalid indices' });
  }

  // Move task
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);

  // Renumber sequentially starting from the lowest existing Sr in this section
  const baseSr = (tasksMaster[sectionKey] || []).length > 0
    ? Math.min(...(tasksMaster[sectionKey] || []).map((t: any) => t.sr))
    : 1;

  const srMapping: Record<number, number> = {};
  const updatedList = list.map((item: any, idx: number) => {
    const newSr = baseSr + idx;
    if (item.sr !== newSr) {
      srMapping[item.sr] = newSr;
    }
    return {
      ...item,
      sr: newSr,
    };
  });

  tasksMaster[sectionKey] = updatedList;

  // Remap historyDB
  const historyDB = { ...currentDb.historyDB };
  if (Object.keys(srMapping).length > 0) {
    Object.keys(historyDB).forEach(date => {
      const dayRec = { ...(historyDB[date] || {}) };
      const remappedEntries: any[] = [];
      const keysToDelete: string[] = [];

      Object.entries(srMapping).forEach(([oldSrStr, newSr]) => {
        const oldKey = `${sectionKey}-${oldSrStr}`;
        const newKey = `${sectionKey}-${newSr}`;
        if (dayRec[oldKey]) {
          remappedEntries.push({ newKey, data: dayRec[oldKey] });
          keysToDelete.push(oldKey);
        }
      });

      keysToDelete.forEach(k => delete dayRec[k]);
      remappedEntries.forEach(({ newKey, data }) => {
        dayRec[newKey] = data;
      });
      historyDB[date] = dayRec;
    });
  }

  currentDb.tasksMaster = tasksMaster;
  currentDb.historyDB = historyDB;
  writeDatabase(currentDb);

  res.json({ success: true, updatedList, srMapping, tasksMaster, historyDB });
});

// Vite dev server integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
