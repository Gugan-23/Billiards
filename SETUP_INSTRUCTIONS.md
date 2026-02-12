# Setup Instructions - Pool Game Score Tracking

## Prerequisites
- Node.js installed (https://nodejs.org/)
- npm (comes with Node.js)

## Installation & Setup

### Step 1: Install Dependencies
```bash
cd /home/gugan/Downloads/Classic-Pool-Game-master
npm install
```

This installs Express.js which runs the server to save JSON files.

### Step 2: Start the Server
```bash
npm start
```

Or manually:
```bash
node server.js
```

You should see:
```
🎱 Pool Game Server running at http://localhost:3000
📁 Score files saved to: /home/gugan/Downloads/Classic-Pool-Game-master/game_scores
```

### Step 3: Open the Game
- Open `index.html` in your browser at `http://localhost:3000`
- Or if running locally: Open the file directly

### Step 4: Play & Scores are Auto-Saved
- Every strike is automatically saved to a JSON file
- Files are saved in: `game_scores/` folder
- Filenames: `pool_scores_YYYY-MM-DD.json`

## Where JSON Files Are Saved

**Location:** `/home/gugan/Downloads/Classic-Pool-Game-master/game_scores/`

**Example Files:**
```
game_scores/
├── pool_scores_2026-02-11T10-30-45-123Z.json
├── pool_scores_2026-02-11T11-15-20-456Z.json
└── pool_scores_2026-02-11T14-45-30-789Z.json
```

## View Saved Scores

### Option 1: Open File in Text Editor
```bash
cat game_scores/pool_scores_*.json
```

### Option 2: Use API Endpoint
Get all scores:
```
http://localhost:3000/api/scores
```

Get latest score:
```
http://localhost:3000/api/scores/latest
```

### Option 3: List Files
```bash
ls -la game_scores/
```

## Console Output

When you play, you'll see in browser console:
```
Strike #1 Score: 2 points
Score data saved to localStorage
✓ JSON file saved to disk: /home/gugan/.../pool_scores_2026-02-11T10-30-45-123Z.json
```

## JSON File Format

```json
{
  "gameDate": "2026-02-11T10:30:45.123Z",
  "totalStrikes": 15,
  "totalStrikeScore": 27,
  "finalScores": {
    "player1": {
      "matchScore": 7,
      "totalScore": 1,
      "color": "red",
      "totalPointsScored": 15
    },
    "player2": {
      "matchScore": 4,
      "totalScore": 0,
      "color": "yellow",
      "totalPointsScored": 12
    }
  },
  "strikes": [
    {
      "strikeNumber": 1,
      "player": 1,
      "strikeScore": 2,
      "ballsPocketed": [
        {
          "color": "red",
          "player": 1,
          "points": 1
        },
        {
          "color": "red",
          "player": 1,
          "points": 1
        }
      ],
      "foul": false,
      "won": false,
      "matchScoreBefore": [0, 0],
      "matchScoreAfter": [2, 0],
      "totalScoreBefore": [0, 0],
      "totalScoreAfter": [0, 0]
    }
  ]
}
```

## Troubleshooting

**Error: "Could not save to server"**
- Make sure Node.js server is running: `npm start`
- Check if port 3000 is available

**Error: "npm command not found"**
- Install Node.js from https://nodejs.org/

**Files not appearing in game_scores folder**
- Check console for error messages
- Verify server is running
- Check folder permissions

## Stop Server
Press `Ctrl + C` in terminal

---

**Your JSON files are now being saved automatically after every strike!** 🎱📊
