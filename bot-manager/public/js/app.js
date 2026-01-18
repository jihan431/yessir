const socket = io();

// State


// ==================== API ====================
async function fetchBots() {
    try {
        const res = await fetch('/api/bots');
        const bots = await res.json();
        renderBots(bots);
    } catch (err) {
        console.error('Failed to fetch bots:', err);
    }
}

async function controlBot(id, action) {
    // Optimistic Update UI (optional, or wait for refresh)
    // showLoading(id)
    
    try {
        const res = await fetch('/api/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action })
        });
        const result = await res.json();
        if (result.success) {
            // Wait a bit for PM2 to update status, then refresh
            setTimeout(fetchBots, 1000);
            setTimeout(fetchBots, 3000);
        } else {
            alert('Error: ' + result.error);
        }
    } catch (err) {
        alert('Network Error');
    }
}

// ==================== RENDERING ====================
function renderBots(bots) {
    const grid = document.getElementById('botGrid');
    
    // Remove "Loading..." state if present
    const loadingState = grid.querySelector('.loading-state');
    if (loadingState) loadingState.remove();

    bots.forEach(bot => {
        let card = document.getElementById(`card-${bot.id}`);
        const isOnline = bot.status === 'online';
        const uptime = formatUptime(bot.uptime);
        
        // Define controls HTML based on status
        const controlsHtml = isOnline 
            ? `<button class="btn btn-restart" onclick="controlBot('${bot.id}', 'restart')">RESTART</button>
               <button class="btn btn-stop" onclick="controlBot('${bot.id}', 'stop')">STOP</button>`
            : `<button class="btn btn-start" onclick="controlBot('${bot.id}', 'start')">START SYSTEM</button>`;

        // Define status color and text
        const statusColor = isOnline ? 'var(--success)' : 'var(--danger)';
        
        if (!card) {
            // Create new card
            card = document.createElement('div');
            card.className = 'bot-card';
            card.id = `card-${bot.id}`;
            card.innerHTML = `
                <!-- Header -->
                <div class="bot-header-section">
                    <div class="bot-title">
                        <h3>${bot.name}</h3>
                        <span class="uptime-display" style="font-size: 0.7rem; color: #666;">UPTIME: ${uptime}</span>
                    </div>
                    <div class="bot-status-badge" style="color: ${statusColor}; border-color: ${statusColor}">${bot.status}</div>
                </div>
                
                <!-- Terminal Window -->
                <div class="bot-terminal-section" id="terminal-${bot.id}">
                    <div class="terminal-line system">Terminal ready. Waiting for logs...</div>
                </div>

                <!-- Controls -->
                <div class="bot-controls-section">
                     ${controlsHtml}
                </div>
            `;
            grid.appendChild(card);
            
            // Auto-join log room for this bot
            socket.emit('join', bot.id);
        } else {
            // Update existing card
            const statusBadge = card.querySelector('.bot-status-badge');
            const uptimeDisplay = card.querySelector('.uptime-display');
            const controlsSection = card.querySelector('.bot-controls-section');
            
            // Update Status
            if (statusBadge.textContent !== bot.status) {
                statusBadge.textContent = bot.status;
                statusBadge.style.color = statusColor;
                statusBadge.style.borderColor = statusColor;
            }
            
            // Update Uptime
            if (uptimeDisplay) uptimeDisplay.textContent = `UPTIME: ${uptime}`;
            
            // Update Controls if status changed (simple check)
            // Note: This replaces buttons, but that's okay as they are stateless
            if (card.dataset.lastStatus !== bot.status) {
                 controlsSection.innerHTML = controlsHtml;
            }
        }
        
        // Cache status for next update check
        card.dataset.lastStatus = bot.status;
    });
}

// ==================== LOGS ====================
// ==================== LOGS ====================
// Integrated into renderBots loop


// Socket Listeners
socket.on('log', (payload) => {
    const terminalId = `terminal-${payload.id}`;
    const terminal = document.getElementById(terminalId);
    
    if (terminal) {
        const div = document.createElement('div');
        div.className = `terminal-line ${payload.type}`;
        
        // Convert ANSI codes to HTML
        const ansi_up = new AnsiUp();
        const html = ansi_up.ansi_to_html(payload.data);
        
        div.innerHTML = html;
        terminal.appendChild(div);
        
        // Auto scroll
        terminal.scrollTop = terminal.scrollHeight;
    }
});


// ==================== UTILS ====================
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(ms) {
    if (!ms || ms < 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const h = Math.floor(m / 60);
    
    if (h > 0) return `${h}h ${m%60}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// Initial Load & Polling
fetchBots();
setInterval(fetchBots, 5000); // Poll status every 5s
