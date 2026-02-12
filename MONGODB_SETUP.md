# MongoDB Pool Game Score Storage - Setup Guide

## Overview
- **Database:** MongoDB (Cloud)
- **Auto-Delete:** 4 hours after game creation
- **Game Modes:** Player vs Player (pvp) & Player vs Computer (pvc)
- **Previous Games:** Automatically deleted when new game starts
- **Backup:** Also saves to local JSON files

## Prerequisites
- Node.js installed
- MongoDB account (using your existing MongoDB Atlas account)

## Installation Steps

### Step 1: Install Dependencies
```bash
cd /home/gugan/Downloads/Classic-Pool-Game-master
npm install
```

This installs:
- `express` - Web server
- `mongodb` - Database client

### Step 2: Start the Server
```bash
npm start
```

Expected output:
```
✓ Connected to MongoDB
✓ TTL index created (4 hour auto-delete)

🎱 Pool Game Server running at http://localhost:3000
📁 Score files backup: /home/gugan/Downloads/Classic-Pool-Game-master/game_scores
🗄️  MongoDB: pool_game.games
⏰ Auto-delete: 4 hours after creation
```

### Step 3: Open the Game
- Visit `http://localhost:3000/index.html`
- Choose: Player vs Player (pvp) or Player vs Computer (pvc)
- Play and scores auto-save

## MongoDB Database Structure

**Database:** `pool_game`  
**Collection:** `games`

### Game Document Schema
```json
{
  "_id": "ObjectId",
  "gameMode": "pvp|pvc",
  "gameDate": "2026-02-11T10:30:45.123Z",
  "totalStrikes": 25,
  "totalStrikeScore": 47,
  "finalScores": {
    "player1": {
      "matchScore": 7,
      "totalScore": 1,
      "color": "red",
      "totalPointsScored": 25
    },
    "player2": {
      "matchScore": 4,
      "totalScore": 0,
      "color": "yellow",
      "isAI": false,
      "totalPointsScored": 22
    }
  },
  "strikes": [
    {
      "strikeNumber": 1,
      "player": 1,
      "strikeScore": 2,
      "ballsPocketed": [...],
      "foul": false,
      "won": false
    }
  ],
  "createdAt": "2026-02-11T10:30:45.123Z"
  // Auto-deleted 4 hours after createdAt
}
```

## API Endpoints

### Save Game Score
```
POST /api/save-score
```
Automatically called after each strike. Deletes previous games first.

**Request:**
```json
{
  "gameMode": "pvp",
  "gameDate": "...",
  "totalStrikes": 25,
  ...
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game saved to MongoDB (PVP)",
  "gameId": "..."
}
```

### Get All Games
```
GET /api/scores
```

**Response:**
```json
{
  "success": true,
  "total": 5,
  "games": [...]
}
```

### Get Latest Game
```
GET /api/scores/latest
```

### Get Games by Mode
```
GET /api/scores/mode/pvp
GET /api/scores/mode/pvc
```

### Get Stats Summary
```
GET /api/scores/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 5,
    "pvpGames": 3,
    "pvcGames": 2,
    "totalStrikes": 127,
    "totalScore": 234,
    "dataRetention": "4 hours (Auto-delete enabled)"
  }
}
```

### Clear All Games (Manual)
```
DELETE /api/scores/clear
```

## Game Flow

1. **New Game Starts**
   - Old games automatically deleted from MongoDB
   - Game mode detected: pvp or pvc
   - New game document created

2. **During Game**
   - Each strike saved after completion
   - Data persists in MongoDB for 4 hours
   - Backup JSON files created in `game_scores/`

3. **After 4 Hours**
   - Document automatically deleted by MongoDB TTL index
   - Only keep backup JSON files if needed

4. **View Data**
   - Use MongoDB Atlas dashboard
   - Or access via API endpoints
   - Check console for logs

## Viewing Data in MongoDB

### Option 1: MongoDB Atlas Dashboard
1. Go to https://cloud.mongodb.com
2. Login to your account
3. Select cluster: `Cluster0`
4. Database: `pool_game`
5. Collection: `games`

### Option 2: API Endpoints
```bash
# Get all games
curl http://localhost:3000/api/scores

# Get latest game
curl http://localhost:3000/api/scores/latest

# Get stats
curl http://localhost:3000/api/scores/stats

# Get PVP games only
curl http://localhost:3000/api/scores/mode/pvp

# Get PVC games only
curl http://localhost:3000/api/scores/mode/pvc
```

### Option 3: Browser Console
Open developer console (F12) and check for messages:
```
✓ Game saved to MongoDB (PVP): ObjectId
⏰ Auto-delete set for 4 hours
```

## Important Features

✅ **Auto-Delete Previous Games**
- When you start a new game, old games are deleted
- Only current game data is stored

✅ **4-Hour Auto-Delete**
- MongoDB TTL index auto-deletes expired documents
- No manual cleanup needed

✅ **Player vs Computer Support**
- `gameMode: 'pvp'` - Two human players
- `gameMode: 'pvc'` - One player vs AI
- Tracked in `player2.isAI` field

✅ **Automatic Backups**
- JSON files saved to `game_scores/` folder
- File format: `pool_scores_YYYY-MM-DD..._{gameMode}.json`

## MongoDB Credentials
```
Connection String: mongodb+srv://vgugan16:gugan2004@cluster0.qyh1fuo.mongodb.net/pool_game
Database: pool_game
Collection: games
TTL Index: createdAt (4 hours)
```

## Troubleshooting

**Error: "Could not connect to MongoDB"**
- Check internet connection
- Verify MongoDB URI in server.js
- Check MongoDB Atlas firewall settings

**Games not appearing in MongoDB**
- Check server console for errors
- Verify game is being played (scores must be recorded)
- Check API endpoint: `GET /api/scores`

**Files not in game_scores folder**
- Check folder permissions
- Verify server is running

**Want to see data immediately?**
```bash
# Get stats
curl http://localhost:3000/api/scores/stats

# Get latest game
curl http://localhost:3000/api/scores/latest
```

## Stop Server
```bash
# In terminal with running server
Ctrl + C
```

---

**All game scores are now stored in MongoDB with auto-cleanup!** 🎱📊🗄️
