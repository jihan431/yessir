module.exports = {
    // Port untuk web panel
    port: 8000,
    
    // Daftar bot yang akan dikelola
    apps: [
        {
            id: "fixred",
            name: "Fix Red",
            script: "index.js",
            cwd: "/home/lyon/Documents/tools/fixredori",
            interpreter: "node",
            description: "Bot Fix WA Banned & Login",
            icon: "🔧"
        },
        {
            id: "cekbio",
            name: "Cek Bio",
            script: "server.js",
            cwd: "/home/lyon/Documents/tools/cekbio",
            interpreter: "node",
            description: "Bot Cek Bio WhatsApp",
            icon: "🔍"
        }
    ]
};
