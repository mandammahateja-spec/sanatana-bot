# 🕉️ Saffron Sovereigns — Sanatana Dharma Discord Bot

A Discord bot for Sanatana Dharma communities built with Python (`discord.py`).

---

## ✨ Features

- **📖 Bhagavad Gita Module**:
  - `jai verse 4.7` — View specific verse with Sanskrit text, transliteration, and word-by-word meanings.
  - `jai chapter 2` — View all verses in a chapter.
  - `jai random` — Get a random Gita verse.

- **📜 Staff Application Wizard**:
  - `jai apply` — 15-question DM application flow. Automatically notifies staff reviewer roles with responses.

- **🕉️ Spiritual Triggers (Auto-replies)**:
  - Responds to `jai shree ram`, `jai shree krishna`, `radhe radhe`, `om namah shivaya`, `jai bhavani`, `jai durga maa`, `namah parvati pataye`, `praise the lord`, `allah hu akbar`, `hare krishna`, `shiv shiv`, `jai mata di`.

- **🛡️ Moderation Commands**:
  - `clear`, `kick`, `ban`, `mute`, `unmute`, `warn` (auto-mute at 3 warnings), `lock`, `unlock`, `temprole`, `slowmode`, `roleadd`, `roleremove`, `send`, `embed`.

- **🎁 Giveaway Commands**:
  - `jai giveaway <winners> <item> <duration> <message>`
  - `jai reroll <message_id>`

- **📜 Help Menu**:
  - `jai help` — Rich Saffron Sovereigns menu.

---

## 🌐 How to Host 24/7 for FREE

### Option 1: Koyeb (Easiest — 100% Free Forever)
1. Sign up at [koyeb.com](https://www.koyeb.com)
2. Click **Create App** → Select **GitHub**.
3. Choose your repository: `mandammahateja-spec/sanatana-bot`.
4. In **Builder type**, choose **Buildpacks** or **Docker**.
5. In **Environment Variables**, add:
   - `DISCORD_TOKEN` = `your_discord_bot_token`
6. Set **Instance type** to `Free` and click **Deploy**.
7. Your bot will run 24/7 without turning off!

---

### Option 2: Render (Free Web Service — 100% Free)
1. Sign up at [render.com](https://render.com)
2. Click **New +** → **Web Service** (Select the **Free** instance tier).
3. Connect your GitHub repo `mandammahateja-spec/sanatana-bot`.
4. Configure settings:
   - **Language**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python bot.py`
   - **Instance Type**: `Free`
5. In **Environment Variables**, add:
   - `DISCORD_TOKEN` = `your_discord_bot_token`
6. Click **Create Web Service**.
*(Note: `bot.py` includes a built-in health check HTTP server that binds to Render's `$PORT`, so Render keeps your Web Service active 24/7 on the Free tier!)*

---

### Option 3: Oracle Cloud Always Free VPS (Most Powerful)
1. Sign up for [Oracle Cloud Always Free Tier](https://www.oracle.com/cloud/free/).
2. Create an **Ampere ARM Compute Instance** (Free 4 OCPU, 24 GB RAM).
3. Connect via SSH:
   ```bash
   sudo apt update && sudo apt install -y python3 python3-pip git
   git clone https://github.com/mandammahateja-spec/sanatana-bot.git
   cd sanatana-bot
   pip install -r requirements.txt
   ```
4. Keep running 24/7 using `systemd` or `pm2`:
   ```bash
   sudo apt install -y npm
   sudo npm install -g pm2
   pm2 start bot.py --name "sanatana-bot" --interpreter python3
   pm2 save
   pm2 startup
   ```

---

## 📄 License
MIT License.
