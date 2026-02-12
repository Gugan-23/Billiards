const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();

const PORT = 3000;
const SCORES_DIR = path.join(__dirname, 'game_scores');

// MongoDB Connection
const MONGO_URI = "mongodb+srv://vgugan16:gugan2004@cluster0.qyh1fuo.mongodb.net/casino?retryWrites=true&w=majority";
let db;
let gamesCollection;
let isConnected = false;

const mongoClient = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongoConnected: isConnected,
        timestamp: new Date().toISOString()
    });
});

// Create scores directory if it doesn't exist
if (!fs.existsSync(SCORES_DIR)) {
    fs.mkdirSync(SCORES_DIR);
}

// Connect to MongoDB with retry logic
async function connectToMongoDB() {
    try {
        if (!isConnected) {
            await mongoClient.connect();
            console.log('✓ Connected to MongoDB');
            isConnected = true;
            
            db = mongoClient.db('casino');
            gamesCollection = db.collection('pool_scores_array');
            
            // Initialize or get the main scores document
            const scoresDoc = await gamesCollection.findOne({ _id: 'all_games' });
            if (!scoresDoc) {
                await gamesCollection.insertOne({
                    _id: 'all_games',
                    games: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log('✓ Initialized main scores document with empty games array');
            }
            
            console.log('✓ Ball color tracking enabled - MongoDB ready');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        isConnected = false;
        setTimeout(connectToMongoDB, 5000);
    }
}

// Handle MongoDB disconnection
mongoClient.on('error', (err) => {
    console.error('MongoDB error event:', err.message);
    isConnected = false;
    connectToMongoDB();
});

// Initial connection
connectToMongoDB();

// **POOL BALL COLORS** - Standard 8-ball pool colors
const BALL_COLORS = {
    solids: ['yellow', 'blue', 'red', 'purple', 'orange', 'green', 'maroon', 'black'],
    stripes: ['yellow_stripe', 'blue_stripe', 'red_stripe', 'purple_stripe', 'orange_stripe', 'green_stripe', 'maroon_stripe'],
    special: ['white_cue', 'eight_ball']
};

// **NEW: Calculate per-color pocketing stats**
function calculateColorStats(strikes) {
    const colorStats = {
        solids: {},
        stripes: {},
        eight_ball: 0,
        white_cue: 0,
        total_pockets: 0
    };

    strikes.forEach(strike => {
        const ballInfo = strike.ball || {};
        const color = ballInfo.color;
        const pocketed = ballInfo.pocketed || false;

        if (pocketed && color) {
            colorStats.total_pockets++;
            
            if (color === 'eight_ball') {
                colorStats.eight_ball++;
            } else if (color === 'white_cue') {
                colorStats.white_cue++;
            } else if (BALL_COLORS.solids.includes(color)) {
                colorStats.solids[color] = (colorStats.solids[color] || 0) + 1;
            } else if (BALL_COLORS.stripes.includes(color)) {
                colorStats.stripes[color] = (colorStats.stripes[color] || 0) + 1;
            }
        }
    });

    return colorStats;
}

// **UPDATED: Save score data endpoint with ball color tracking**
app.post('/api/save-score', async (req, res) => {
    try {
        if (!isConnected || !gamesCollection) {
            return res.status(503).json({ 
                success: false, 
                error: 'MongoDB not connected. Will retry...',
                status: 'reconnecting'
            });
        }
        
        const gameData = req.body;
        const gameMode = gameData.gameMode || 'pvp';
        
        // Calculate ball color statistics for this game
        const colorStats = calculateColorStats(gameData.strikes || []);
        
        // Create enhanced game record with color tracking
        const gameRecord = {
            gameId: new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9),
            gameMode: gameMode,
            gameDate: gameData.gameDate || new Date().toISOString(),
            totalStrikes: gameData.totalStrikes || 0,
            totalStrikeScore: gameData.totalStrikeScore || 0,
            finalScores: gameData.finalScores || {},
            strikes: gameData.strikes || [],
            // **NEW: Ball color statistics**
            ballColorStats: colorStats,
            colorBreakdown: {
                solidsPotted: Object.values(colorStats.solids).reduce((a, b) => a + b, 0),
                stripesPotted: Object.values(colorStats.stripes).reduce((a, b) => a + b, 0),
                eightBallPotted: colorStats.eight_ball,
                totalUniqueColors: Object.keys({ ...colorStats.solids, ...colorStats.stripes }).length
            },
            createdAt: new Date()
        };
        
        // Push to games array in the main document
        const result = await gamesCollection.updateOne(
            { _id: 'all_games' },
            {
                $push: { games: gameRecord },
                $set: { updatedAt: new Date() }
            }
        );
        
        // Count total games
        const mainDoc = await gamesCollection.findOne({ _id: 'all_games' });
        const totalGames = mainDoc?.games?.length || 0;
        
        console.log(`✓ Game #${totalGames} saved (${gameMode.toUpperCase()})`);
        console.log(`  🎨 Solids potted: ${gameRecord.colorBreakdown.solidsPotted}`);
        console.log(`  🎨 Stripes potted: ${gameRecord.colorBreakdown.stripesPotted}`);
        console.log(`  ⚫ 8-ball: ${gameRecord.ballColorStats.eight_ball}`);
        console.log(`  Total games: ${totalGames}`);
        
        // Backup to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `pool_scores_${timestamp}_${gameMode}.json`;
        const filepath = path.join(SCORES_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify(gameData, null, 2));
        
        res.json({ 
            success: true, 
            message: `Game saved with ball color tracking`,
            gameId: gameRecord.gameId,
            totalGames: totalGames,
            colorStats: colorStats,
            filepath: filepath
        });
    } catch (error) {
        console.error('Error saving game:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// **NEW: Get color-specific analytics**
app.get('/api/scores/color-stats', async (req, res) => {
    try {
        if (!isConnected || !gamesCollection) {
            return res.status(503).json({ success: false, error: 'MongoDB not connected' });
        }
        
        const mainDoc = await gamesCollection.findOne({ _id: 'all_games' });
        const allGames = mainDoc?.games || [];
        
        // Aggregate color stats across ALL games
        const globalColorStats = {
            solids: {},
            stripes: {},
            eight_ball: 0,
            white_cue: 0,
            total_pockets: 0,
            games_analyzed: allGames.length
        };
        
        allGames.forEach(game => {
            const stats = game.ballColorStats || calculateColorStats(game.strikes || []);
            
            // Merge solids
            Object.entries(stats.solids).forEach(([color, count]) => {
                globalColorStats.solids[color] = (globalColorStats.solids[color] || 0) + count;
            });
            
            // Merge stripes
            Object.entries(stats.stripes).forEach(([color, count]) => {
                globalColorStats.stripes[color] = (globalColorStats.stripes[color] || 0) + count;
            });
            
            globalColorStats.eight_ball += stats.eight_ball;
            globalColorStats.white_cue += stats.white_cue;
            globalColorStats.total_pockets += stats.total_pockets;
        });
        
        res.json({
            success: true,
            stats: globalColorStats,
            accuracy: {
                solids_pct: Object.values(globalColorStats.solids).reduce((a,b)=>a+b,0) / globalColorStats.total_pockets || 0,
                stripes_pct: Object.values(globalColorStats.stripes).reduce((a,b)=>a+b,0) / globalColorStats.total_pockets || 0
            }
        });
    } catch (error) {
        console.error('Error getting color stats:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all games (unchanged)
app.get('/api/scores', async (req, res) => {
    try {
        if (!isConnected || !gamesCollection) {
            return res.status(503).json({ success: false, error: 'MongoDB not connected', games: [] });
        }
        
        const mainDoc = await gamesCollection.findOne({ _id: 'all_games' });
        const games = mainDoc?.games || [];
        
        res.json({
            success: true,
            total: games.length,
            games: games
        });
    } catch (error) {
        console.error('Error retrieving games:', error.message);
        res.status(500).json({ success: false, error: error.message, games: [] });
    }
});

// Get latest game (unchanged)
app.get('/api/scores/latest', async (req, res) => {
    try {
        if (!isConnected || !gamesCollection) {
            return res.status(503).json({ success: false, error: 'MongoDB not connected' });
        }
        
        const mainDoc = await gamesCollection.findOne({ _id: 'all_games' });
        const games = mainDoc?.games || [];
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'No games found' });
        }
        
        const latestGame = games[games.length - 1];
        res.json({ success: true, game: latestGame });
    } catch (error) {
        console.error('Error retrieving latest game:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get game stats summary (ENHANCED with color stats)
app.get('/api/scores/stats', async (req, res) => {
    try {
        if (!isConnected || !gamesCollection) {
            return res.status(503).json({ success: false, error: 'MongoDB not connected', stats: {} });
        }
        
        const mainDoc = await gamesCollection.findOne({ _id: 'all_games' });
        const allGames = mainDoc?.games || [];
        
        const pvpGames = allGames.filter(g => g.gameMode === 'pvp').length;
        const pvcGames = allGames.filter(g => g.gameMode === 'pvc').length;
        const totalStrikes = allGames.reduce((sum, g) => sum + (g.totalStrikes || 0), 0);
        const totalScore = allGames.reduce((sum, g) => sum + (g.totalStrikeScore || 0), 0);
        
        // Color stats summary
        const colorSummary = allGames.reduce((acc, game) => {
            const stats = game.ballColorStats || {};
            acc.solids += Object.values(stats.solids || {}).reduce((a,b)=>a+b,0);
            acc.stripes += Object.values(stats.stripes || {}).reduce((a,b)=>a+b,0);
            acc.eight_ball += stats.eight_ball || 0;
            return acc;
        }, { solids: 0, stripes: 0, eight_ball: 0 });
        
        res.json({
            success: true,
            stats: {
                totalGames: allGames.length,
                pvpGames: pvpGames,
                pvcGames: pvcGames,
                totalStrikes: totalStrikes,
                totalScore: totalScore,
                colorSummary: colorSummary,
                dataRetention: '4 hours (Auto-delete enabled)',
                mongoConnected: isConnected,
                storageMethod: 'Single array with ball color tracking'
            }
        });
    } catch (error) {
        console.error('Error retrieving stats:', error.message);
        res.status(500).json({ success: false, error: error.message, stats: {} });
    }
});

// Clear games (unchanged)
app.delete('/api/scores/clear', async (req, res) => {
    try {
        if (!isConnected || !gamesCollection) {
            return res.status(503).json({ success: false, error: 'MongoDB not connected' });
        }
        
        const result = await gamesCollection.updateOne(
            { _id: 'all_games' },
            { $set: { games: [], updatedAt: new Date() } }
        );
        
        console.log(`🗑️ Cleared all games (including color tracking)`);
        res.json({ success: true, message: `Cleared all games` });
    } catch (error) {
        console.error('Error clearing games:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Graceful shutdown (unchanged)
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (mongoClient) await mongoClient.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (mongoClient) await mongoClient.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`\n🎱 Pool Game Server with BALL COLOR TRACKING`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📁 Backup files: ${SCORES_DIR}`);
    console.log(`🗄️  MongoDB: casino.pool_scores_array`);
    console.log(`🎨 NEW: Tracks solids, stripes, 8-ball, cue ball`);
    console.log(`📊 NEW endpoint: GET /api/scores/color-stats\n`);
});
