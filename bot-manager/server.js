const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pm2 = require('pm2');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { content: cors });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper: Connect to PM2
function pm2Connect() {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Helper: Get Process List
function getPM2List() {
    return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
            if (err) reject(err);
            else resolve(list);
        });
    });
}

// Helper: Start Process
function startProcess(appConfig) {
    return new Promise((resolve, reject) => {
        pm2.start({
            script: appConfig.script,
            name: appConfig.id, // Use ID as PM2 name for consistency
            cwd: appConfig.cwd,
            interpreter: appConfig.interpreter || 'node',
            autorestart: true
        }, (err, apps) => {
            if (err) reject(err);
            else resolve(apps);
        });
    });
}

// ==================== API ROUTES ====================

// Get all bots status
app.get('/api/bots', async (req, res) => {
    try {
        await pm2Connect();
        const list = await getPM2List();
        
        const bots = config.apps.map(appConfig => {
            const pm2Proc = list.find(p => p.name === appConfig.id);
            return {
                ...appConfig,
                status: pm2Proc ? pm2Proc.pm2_env.status : 'stopped',
                uptime: pm2Proc ? (Date.now() - pm2Proc.pm2_env.pm_uptime) : 0,
                memory: pm2Proc ? pm2Proc.monit.memory : 0,
                cpu: pm2Proc ? pm2Proc.monit.cpu : 0
            };
        });
        
        res.json(bots);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Control actions (start/stop/restart)
app.post('/api/control', async (req, res) => {
    const { id, action } = req.body;
    const appConfig = config.apps.find(a => a.id === id);
    
    if (!appConfig) return res.status(404).json({ error: 'Bot not found' });
    
    try {
        await pm2Connect();
        
        if (action === 'start') {
            await startProcess(appConfig);
        } else if (action === 'stop') {
            await new Promise((resolve, reject) => {
                pm2.stop(id, (err) => {
                    if (err && !err.message.includes('process not found')) reject(err);
                    else resolve();
                });
            });
        } else if (action === 'restart') {
            await new Promise((resolve, reject) => {
                pm2.restart(id, (err) => {
                    if (err) {
                        // If restart fails (maybe process doesn't exist), try start
                        startProcess(appConfig).then(resolve).catch(reject);
                    } else resolve();
                });
            });
        }
        
        res.json({ success: true, message: `Action ${action} executed for ${id}` });
    } catch (err) {
        console.error('PM2 Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== SOCKET.IO LOGS ====================

// PM2 Log Bus for real-time logs
pm2.launchBus((err, bus) => {
    if (err) return console.error('PM2 Log Bus Error:', err);
    
    console.log('🔌 Connected to PM2 Log Bus');

    bus.on('log:out', (packet) => {
        if (config.apps.find(a => a.id === packet.process.name)) {
            io.to(packet.process.name).emit('log', { 
                type: 'out', 
                data: packet.data,
                id: packet.process.name // Pass ID to client
            });
        }
    });

    bus.on('log:err', (packet) => {
       if (config.apps.find(a => a.id === packet.process.name)) {
            io.to(packet.process.name).emit('log', { 
                type: 'err', 
                data: packet.data,
                id: packet.process.name 
            });
        }
    });
});

io.on('connection', (socket) => {
    socket.on('join', (room) => {
        socket.join(room);
        // Send initial connection message?
    });
    
    socket.on('leave', (room) => {
        socket.leave(room);
    });
});

// ==================== START SERVER ====================
const PORT = config.port || 8000;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║       BOT MANAGER PANEL STARTED       ║
╠═══════════════════════════════════════╣
║  🌐 Panel: http://localhost:${PORT}      ║
║  🔌 PM2 Integration Active            ║
╚═══════════════════════════════════════╝
    `);
});
