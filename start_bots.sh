#!/bin/bash

# ====================================
# Script untuk menjalankan 2 bot
# dengan screen, auto stop saat exit
# ====================================

CEKBIO_DIR="/home/lyon/Documents/tools/cekbio"
FIXRED_DIR="/home/lyon/Documents/tools/fixredori"

# Warna
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
    echo -e "\n${YELLOW}[!] Menghentikan semua bot...${NC}"
    screen -S cekbio -X quit 2>/dev/null
    screen -S fixred -X quit 2>/dev/null
    echo -e "${GREEN}[✓] Semua bot dihentikan${NC}"
    exit 0
}

# Trap Ctrl+C dan exit
trap cleanup SIGINT SIGTERM EXIT

echo -e "${GREEN}"
echo "╔════════════════════════════════════╗"
echo "║       BOT MANAGER - START ALL      ║"
echo "╚════════════════════════════════════╝"
echo -e "${NC}"

# Kill existing screens if any
screen -S cekbio -X quit 2>/dev/null
screen -S fixred -X quit 2>/dev/null

# Start cekbio
echo -e "${YELLOW}[1/2] Starting cekbio...${NC}"
screen -dmS cekbio bash -c "cd $CEKBIO_DIR && npm start"
sleep 2

# Start fixred
echo -e "${YELLOW}[2/2] Starting fixred...${NC}"
screen -dmS fixred bash -c "cd $FIXRED_DIR && npm start"
sleep 2

echo ""
echo -e "${GREEN}[✓] Kedua bot sudah berjalan!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}cekbio${NC}  : screen -r cekbio"
echo -e "  ${GREEN}fixred${NC}  : screen -r fixred"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Tekan Ctrl+C untuk stop semua bot${NC}"
echo ""

# Keep script running
while true; do
    sleep 1
done
