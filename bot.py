import discord
from discord.ext import commands
import asyncio
import re
import random
import json
import os
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

load_dotenv()

# --- Lightweight Web Server for Render Free Tier (Port binding) ---
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Saffron Sovereigns Bot is Online!")

    def log_message(self, format, *args):
        return

def run_web_server():
    port = int(os.getenv("PORT", "8080"))
    try:
        server = HTTPServer(("0.0.0.0", port), HealthCheckHandler)
        print(f"Web server listening on port {port} for Render health check")
        server.serve_forever()
    except Exception as e:
        print(f"Web server warning: {e}")

threading.Thread(target=run_web_server, daemon=True).start()
# -----------------------------------------------------------------

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=["jai ", "Jai "], intents=intents)
bot.remove_command("help")

MOD_USER_ID = 1090139157071937616
warns = {}
REVIEWER_ROLE_IDS = [1376192351080419408, 1376192364292345968, 1376192357514346496, 1376192371146096791]

# Load verse and chapter data
VERSE_FILE = "verse.json"
CHAPTER_FILE = "chapters.json"

def load_verses():
    with open(VERSE_FILE, "r", encoding="utf-8") as vf:
        return json.load(vf)

def load_chapters():
    with open(CHAPTER_FILE, "r", encoding="utf-8") as cf:
        return json.load(cf)

verses = load_verses()
chapters = load_chapters()

staff_questions = [
    "1. What is your full name?",
    "2. What is your age?",
    "3. In which city and country do you live?",
    "4. What is your timezone (e.g., IST, GMT+5:30)?",
    "5. Which role are you applying for (Utsav Sanchalak / Yanthra Adhikari)?",
    "6. Why do you want to join the staff team?",
    "7. What qualities make you a good candidate?",
    "8. How much time can you dedicate per day to this server?",
    "9. Are you part of staff in any other servers?",
    "10. Have you ever moderated a community before?",
    "11. What does Sanatana Dharma mean to you?",
    "12. How do you deal with conflicts in a group?",
    "13. What’s your knowledge level about Hindu scriptures?",
    "14. Can you attend meetings/events if called upon?",
    "15. Is there anything else you'd like us to know?"
]

PATTERNS = {
    r"\bjai\s+shree\s+ram\b": "🚩 जय श्री राम! {user_mention}",
    r"\bjai\s+shree\s+krishna\b": "🕉️ जय श्री कृष्ण! {user_mention}",
    r"\bradhe\s+radhe\b": "🌸 राधे राधे! {user_mention}",
    r"\bom\s+namah\s+shivaya\b": "🔱 ॐ नमः शिवाय! {user_mention}",
    r"\bjai\s+bhavani\b": "⚔️ जय भवानी! {user_mention}",
    r"\bjai\s+durga\s+maa\b": "🌺 जय दुर्गा माता! {user_mention}",
    r"\bnamah\s+parvati\s+pataye\b": "🔔 हर हर महादेव! {user_mention}",
    r"\bpraise\s+the\s+lord\b": "🙏 Praise the Lord! 🌟 {user_mention}",
    r"\ballah\s+hu\s+akbar\b": "☪️ Allah Hu Akbar! 🤲 {user_mention}",
    r"\bhare\s+krishna\b": "🎶 Hare Rama! ✨ {user_mention}",
    r"\bshiv\s+shiv\b": "🕉️ शिव शिव! May Mahadev bless you, {user_mention} 🔱",
    r"\bjai\s+mata\s+di\b": "🌼 जय माता दी! Divine blessings to you, {user_mention} 🙏"
}

def has_mod_permissions(ctx):
    perms = ctx.author.guild_permissions
    return any([
        perms.administrator,
        perms.manage_channels,
        perms.manage_messages,
        perms.kick_members,
        perms.ban_members
    ]) or ctx.author.id == MOD_USER_ID

def mod_check():
    return commands.check(lambda ctx: has_mod_permissions(ctx))

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user.name}")
    await bot.change_presence(
        status=discord.Status.online,
        activity=discord.Game("Jai Shree Ram | jai help")
    )

@bot.event
async def on_message(message):
    if message.author.bot:
        return
    for pattern, reply in PATTERNS.items():
        if re.search(pattern, message.content, re.IGNORECASE):
            await message.channel.send(reply.format(user_mention=message.author.mention))
            break
    await bot.process_commands(message)

# === MODERATION COMMANDS ===
@bot.command(name="apply", help="Apply for a staff role")
async def apply(ctx):
    try:
        await ctx.message.delete()
        await ctx.author.send("🪔 **Welcome to the Saffron Sovereigns Staff Application!**\nPlease answer the following 15 questions one by one.")
    except discord.Forbidden:
        return await ctx.send(f"{ctx.author.mention} please enable your DMs and try again.")

    answers = []

    def check(m):
        return m.author == ctx.author and isinstance(m.channel, discord.DMChannel)

    for question in staff_questions:
        await ctx.author.send(question)
        try:
            msg = await bot.wait_for("message", check=check, timeout=120.0)
            answers.append(msg.content)
        except:
            await ctx.author.send("⏳ Timeout. Please re-apply when you're ready.")
            return

    # Compile the application
    embed = discord.Embed(
        title="📜 New Staff Application",
        description=f"**Applicant:** {ctx.author.mention} ({ctx.author})\n\n🧾 **Responses:**",
        color=discord.Color.orange()
    )
    for i, (q, a) in enumerate(zip(staff_questions, answers), start=1):
        embed.add_field(name=f"Q{i}: {q}", value=a, inline=False)

    embed.set_footer(text="Awaiting interview call...")

    # Send to all members with the reviewer roles
    sent_to = 0
    for guild in bot.guilds:
        for role_id in REVIEWER_ROLE_IDS:
            role = discord.utils.get(guild.roles, id=role_id)
            if role:
                for member in role.members:
                    try:
                        await member.send(embed=embed)
                        sent_to += 1
                    except:
                        pass

    await ctx.author.send(f"✅ Your application has been submitted to the team. Total reviewers notified: {sent_to}\nPlease wait to be contacted for an interview. 🙏")

@bot.command()
@mod_check()
async def clear(ctx, amount: int = 5):
    await ctx.channel.purge(limit=amount + 1)
    await ctx.send(f"🧹 Cleared {amount} messages!", delete_after=5)

@bot.command()
@mod_check()
async def kick(ctx, member: discord.Member, *, reason=None):
    await member.kick(reason=reason)
    await ctx.send(f"👢 {member.mention} has been kicked. Reason: {reason}")

@bot.command()
@mod_check()
async def ban(ctx, member: discord.Member, *, reason=None):
    await member.ban(reason=reason)
    await ctx.send(f"🔨 {member.mention} has been banned. Reason: {reason}")

@bot.command()
@mod_check()
async def mute(ctx, member: discord.Member, duration: int, *, reason=None):
    muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
    if not muted_role:
        muted_role = await ctx.guild.create_role(name="Muted")
        for channel in ctx.guild.channels:
            await channel.set_permissions(muted_role, send_messages=False, speak=False)
    await member.add_roles(muted_role)
    await ctx.send(f"🔇 {member.mention} muted for {duration} minutes.")
    await asyncio.sleep(duration * 60)
    await member.remove_roles(muted_role)
    await ctx.send(f"🔊 {member.mention} has been unmuted.")

@bot.command()
@mod_check()
async def unmute(ctx, member: discord.Member):
    muted_role = discord.utils.get(ctx.guild.roles, name="Muted")
    if muted_role in member.roles:
        await member.remove_roles(muted_role)
        await ctx.send(f"🔊 {member.mention} has been unmuted.")

@bot.command()
@mod_check()
async def warn(ctx, member: discord.Member, *, reason=None):
    user_id = str(member.id)
    warns[user_id] = warns.get(user_id, 0) + 1
    await ctx.send(f"⚠️ {member.mention} has been warned. Reason: {reason}")
    try:
        await member.send(f"⚠️ You were warned in {ctx.guild.name}. Reason: {reason}")
    except:
        pass
    if warns[user_id] >= 3:
        await mute(ctx, member, 60, reason="Auto mute for 3 warnings")
        warns[user_id] = 0

@bot.command()
@mod_check()
async def embed(ctx, *, message):
    embed = discord.Embed(description=message, color=0xff9900)
    await ctx.send(embed=embed)

@bot.command()
@mod_check()
async def send(ctx, *, message):
    await ctx.message.delete()
    match = re.match(r"<#(\d+)> (.+)", message, re.DOTALL)
    if match:
        channel_id = int(match.group(1))
        content = match.group(2)
        channel = ctx.guild.get_channel(channel_id)
        if channel:
            chunks = [content[i:i+2000] for i in range(0, len(content), 2000)]
            for chunk in chunks:
                await channel.send(chunk)
        else:
            await ctx.send("❌ Channel not found.")
    else:
        await ctx.send("⚠️ Use format: `jai send #channel your message`")

@bot.command()
@mod_check()
async def lock(ctx):
    overwrite = ctx.channel.overwrites_for(ctx.guild.default_role)
    overwrite.send_messages = False
    overwrite.add_reactions = False
    overwrite.create_public_threads = False
    overwrite.create_private_threads = False

    await ctx.channel.set_permissions(ctx.guild.default_role, overwrite=overwrite)

    for thread in ctx.channel.threads:
        await thread.edit(locked=True, archived=True)

    await ctx.send("🔒 Channel and all its threads locked for everyone")

@bot.command()
@mod_check()
async def unlock(ctx):
    overwrite = ctx.channel.overwrites_for(ctx.guild.default_role)
    overwrite.send_messages = True
    await ctx.channel.set_permissions(ctx.guild.default_role, overwrite=overwrite)
    await ctx.send("🔓 Channel unlocked for everyone")

@bot.command()
@mod_check()
async def roleadd(ctx, permission: str, *, role_name: str):
    role = discord.utils.get(ctx.guild.roles, name=role_name)
    if not role:
        await ctx.send("❌ Role not found.")
        return
    perms = role.permissions
    if permission == "administrator":
        perms.administrator = True
    elif permission == "manage_channels":
        perms.manage_channels = True
    elif permission == "manage_messages":
        perms.manage_messages = True
    else:
        await ctx.send("⚠️ Try: administrator, manage_channels, manage_messages")
        return
    await role.edit(permissions=perms)
    await ctx.send(f"✅ `{permission}` granted to `{role_name}`")

@bot.command()
@mod_check()
async def roleremove(ctx, role: discord.Role, member: discord.Member):
    if role in member.roles:
        await member.remove_roles(role)
        await ctx.send(f"❌ Removed {role.name} from {member.mention}")

@bot.command()
@mod_check()
async def slowmode(ctx, seconds: int):
    await ctx.channel.edit(slowmode_delay=seconds)
    await ctx.send(f"🐢 Slowmode set to {seconds} seconds.")

@bot.command()
@mod_check()
async def temprole(ctx, member: discord.Member, role: discord.Role, duration: str):
    time_unit = duration[-1]
    time_val = int(duration[:-1])
    seconds = {"s": 1, "m": 60, "h": 3600}.get(time_unit)
    if not seconds:
        await ctx.send("⚠️ Use like: `10s`, `5m`, `2h`")
        return
    await member.add_roles(role)
    await ctx.send(f"⏳ {member.mention} got role {role.name} for {duration}")
    await asyncio.sleep(time_val * seconds)
    await member.remove_roles(role)
    await ctx.send(f"⌛ {member.mention}'s role {role.name} removed after {duration}")

# === GIVEAWAY ===
@bot.command()
@mod_check()
async def giveaway(ctx, winners: int, item: str, duration: str, *, message: str):
    seconds = int(duration[:-1]) * {"s": 1, "m": 60, "h": 3600}.get(duration[-1], 1)
    embed = discord.Embed(
        title="🎉 GIVEAWAY TIME!",
        description=f"**{message}**\n\n🎁 **Prize**: {item}\n🏆 **Winners**: {winners}\n⏳ Ends in: {duration}",
        color=0xf39c12
    )
    embed.set_footer(text="React with 🎉 to enter!")
    giveaway_msg = await ctx.send(embed=embed)
    await giveaway_msg.add_reaction("🎉")
    await asyncio.sleep(seconds)
    new_msg = await ctx.channel.fetch_message(giveaway_msg.id)
    users = [u async for u in new_msg.reactions[0].users() if not u.bot]
    if not users:
        return await ctx.send("😢 No participants!")
    winners_list = random.sample(users, min(winners, len(users)))
    await ctx.send("🎊 Congrats " + ", ".join(w.mention for w in winners_list) + f"! You won **{item}** 🎁")

@bot.command()
@mod_check()
async def reroll(ctx, message_id: int):
    try:
        msg = await ctx.channel.fetch_message(message_id)
        users = [u async for u in msg.reactions[0].users() if not u.bot]
        winner = random.choice(users)
        await ctx.send(f"🔁 New winner: {winner.mention} 🎉")
    except:
        await ctx.send("⚠️ Could not reroll. Make sure the message ID is correct.")

@bot.command(name="random")
async def gita_random(ctx):
    verse = random.choice(verses)
    chapter_number = verse["chapter_number"]
    verse_number = verse["verse_number"]
    chapter = next((c for c in chapters if c["chapter_number"] == chapter_number), None)
    chapter_name = chapter["name_translation"] if chapter else f"Chapter {chapter_number}"

    embed = discord.Embed(
        title=f"📖 Chapter {chapter_number} – {chapter_name} | Verse {verse_number}",
        description=verse["text"].strip(),
        color=discord.Color.blue()
    )
    embed.add_field(name="🔤 Transliteration", value=verse.get("transliteration", "Not available"), inline=False)
    embed.add_field(name="📝 Word-by-word", value=verse.get("word_meanings", "No meanings available"), inline=False)
    await ctx.send(embed=embed)

@bot.command()
async def verse(ctx, reference: str):
    try:
        chapter_num, verse_num = map(int, reference.split("."))
    except ValueError:
        return await ctx.send("❌ Use format like `jai verse 4.7`")

    match = next((v for v in verses if v["chapter_number"] == chapter_num and v["verse_number"] == verse_num), None)
    if not match:
        return await ctx.send(f"🔍 Verse {reference} not found.")

    chapter_info = next((c for c in chapters if c["chapter_number"] == chapter_num), None)
    chapter_name = chapter_info["name_translation"] if chapter_info else f"Chapter {chapter_num}"

    embed = discord.Embed(
        title=f"📖 Chapter {chapter_num} – {chapter_name} | Verse {verse_num}",
        description=match["text"].strip(),
        color=discord.Color.purple()
    )
    embed.add_field(name="🔤 Transliteration", value=match.get("transliteration", "Not available"), inline=False)
    embed.add_field(name="📝 Word-by-word", value=match.get("word_meanings", "No meanings available"), inline=False)
    await ctx.send(embed=embed)

@bot.command()
async def chapter(ctx, number: int):
    results = [v for v in verses if v["chapter_number"] == number]
    chapter = next((c for c in chapters if c["chapter_number"] == number), None)
    chapter_name = chapter["name_translation"] if chapter else f"Chapter {number}"

    if not results:
        return await ctx.send("❌ No verses found for that chapter.")

    await ctx.send(f"📚 **{chapter_name}** – {len(results)} verses found.")
    for verse in results:
        embed = discord.Embed(
            title=f"🕈 Chapter {number} | Verse {verse['verse_number']}",
            description=verse["text"].strip(),
            color=discord.Color.teal()
        )
        embed.add_field(name="🔤 Transliteration", value=verse.get("transliteration", "Not available"), inline=False)
        embed.add_field(name="📝 Word-by-word", value=verse.get("word_meanings", "No meanings available"), inline=False)
        await ctx.send(embed=embed)

@bot.command()
async def help(ctx):
    embed = discord.Embed(
        title="📜 Saffron Sovereigns Help Menu",
        description="✨ Master your Sanatana Circle with divine commands & powerful tools!",
        color=0xff9900
    )
    embed.set_image(url="https://cdn.discordapp.com/attachments/1376192732208562187/1394667908126216334/file_00000000dd5861f7a570adb099d7e765.png?ex=6877a534&is=687653b4&hm=8b9164c5edb17e443c1a9d4760d3cc583ce16e1d3575508ade47e0cde4456667&")

    embed.add_field(name="🛡️ Moderation", value=(
        "🧹 `jai clear 5`\n"
        "👢 `jai kick @user`\n"
        "🔨 `jai ban @user`\n"
        "🔇 `jai mute @user 10`\n"
        "🔊 `jai unmute @user`\n"
        "⚠️ `jai warn @user`\n"
        "🔒 `jai lock`\n"
        "🔓 `jai unlock`\n"
        "⏳ `jai temprole @user @role 10s`\n"
        "🐢 `jai slowmode 10`\n"
        "⚙️ `jai roleadd permission RoleName`\n"
        "🚫 `jai roleremove @role @user`\n"
        "📤 `jai send #channel message`\n"
        "🖼️ `jai embed message`"
    ), inline=False)

    embed.add_field(name="🎁 Giveaway", value=(
        "🎉 `jai giveaway 1 Item 10s Message`\n"
        "🔁 `jai reroll message_id`"
    ), inline=False)

    embed.add_field(name="🕉️ Spiritual Triggers", value=(
        "🚩 `jai shree ram`\n"
        "🕉️ `jai shree krishna`\n"
        "🌸 `radhe radhe`\n"
        "🔱 `om namah shivaya`\n"
        "🔔 `namah parvati pataye`\n"
        "🎶 `hare krishna`\n"
        "⚔️ `jai bhavani`\n"
        "🌺 `jai durga maa`\n"
        "☪️ `allah hu akbar`\n"
        "🙏 `praise the lord`\n"
        "🕉️ `shiv shiv`\n"
        "🌼 `jai mata di`"
    ), inline=False)

    embed.add_field(name="📖 Gita Commands", value=(
        "🔢 `jai verse 4.7` – Shows Chapter 4 Verse 7\n"
        "📚 `jai chapter 2` – Lists all verses in Chapter 2\n"
        "📜 `jai random` – Shows a random Gita verse"
    ), inline=False)

    embed.set_footer(text="🚩 Saffron Sovereigns by Mahateja1")
    await ctx.send(embed=embed)

token = os.getenv("DISCORD_TOKEN")
if not token:
    raise ValueError("DISCORD_TOKEN environment variable is missing in .env")

bot.run(token)
