# Score Tracking Implementation

## What Was Added

Your pool game now tracks and saves **strike scores** to JSON automatically after every shot.

### Key Features:

1. **Strike Score Calculation**
   - Each ball pocketed = **1 point**
   - No balls pocketed = **0 points**
   - Score is calculated based on billiard rules

2. **JSON Saved After Every Strike**
   - Automatically saved to **localStorage** after each shot
   - Contains complete strike data with scores
   - Downloaded at end of game as `pool_game_scores.json`

3. **Data Tracked Per Strike:**
   ```javascript
   {
     "strikeNumber": 1,
     "player": 1,
     "strikeScore": 2,              // Points for this strike (0 if no balls pocketed)
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
     "matchScoreAfter": [2, 0]
   }
   ```

4. **JSON File Structure:**
   ```json
   {
     "gameDate": "2026-02-11T10:30:00.000Z",
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
         "totalPointsScored": 22
       }
     },
     "strikes": [...]
   }
   ```

## How to Use

1. **During Game:**
   - Scores are automatically calculated and saved after each strike
   - Check browser console to see: `Strike #1 Score: 2 points`
   - Data is stored in localStorage

2. **At Game End:**
   - Final JSON file is automatically downloaded as `pool_game_scores.json`
   - Contains complete game history with all strikes and scores

3. **Access Data:**
   - Open browser Developer Tools (F12)
   - Go to Application → Local Storage
   - Look for `poolGameScores` entry

## Modified Files

- **GamePolicy.js**
  - Added `strikeScore` tracking
  - Added `strikeScore` to strike data
  - JSON saved after every strike
  - Added `exportScoresToJSON()` method
  - Added `getFinalGameDataForDownload()` method

## Scoring Rules Implemented

- **Strike with balls pocketed:** Score = number of balls pocketed (1 point each)
- **Strike with no balls pocketed:** Score = 0
- **Points are independent from match scoring** (match score tracks 7-ball completion)
