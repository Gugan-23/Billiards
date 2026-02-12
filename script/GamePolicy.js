
function GamePolicy(){

    this.turn = 0;
    this.firstCollision = true;
    let player1TotalScore = new Score(new Vector2(Game.size.x/2 - 75,Game.size.y/2 - 45));
    let player2TotalScore = new Score(new Vector2(Game.size.x/2 + 75,Game.size.y/2 - 45));

    let player1MatchScore = new Score(new Vector2(Game.size.x/2 - 280,108));
    let player2MatchScore = new Score(new Vector2(Game.size.x/2 + 230,108));

    this.players = [new Player(player1MatchScore,player1TotalScore), new Player(player2MatchScore,player2TotalScore)];
    this.foul = false;
    this.scored = false;
    this.won = false;
    this.turnPlayed = false;
    this.validBallsInsertedOnTurn = 0;
    
    // Score history tracking
    this.strikeHistory = [];
    this.currentStrikeData = null;
    this.strikeScore = 0; // Points earned in current strike (1 point per ball pocketed)

    this.leftBorderX = BORDER_SIZE;
    this.rightBorderX = Game.size.x - BORDER_SIZE;
    this.topBorderY = BORDER_SIZE;
    this.bottomBorderY = Game.size.y - BORDER_SIZE;

    this.topCenterHolePos = new Vector2(750,32);
    this.bottomCenterHolePos = new Vector2(750,794);
    this.topLeftHolePos = new Vector2(62,62);
    this.topRightHolePos = new Vector2(1435,62);
    this.bottomLeftHolePos = new Vector2(62,762)
    this.bottomRightHolePos = new Vector2(1435,762);
}

GamePolicy.prototype.reset = function(){
    this.turn = 0;
    this.players[0].matchScore.value = 0;
    this.players[0].color = undefined;
    this.players[1].matchScore.value = 0;
    this.players[1].color = undefined;
    this.foul = false;
    this.scored = false;
    this.turnPlayed = false;
    this.won = false;
    this.firstCollision = true;
    this.validBallsInsertedOnTurn = 0;
    
    // Save current match scores to history
    this.exportScoresToJSON();
    this.strikeHistory = [];
    this.currentStrikeData = null;
}
GamePolicy.prototype.initializeCurrentStrike = function(){
    if(!this.currentStrikeData){
        this.strikeScore = 0; // Reset strike score for new strike
        this.currentStrikeData = {
            strikeNumber: this.strikeHistory.length + 1,
            player: this.turn + 1,
            ballsPocketed: [],
            strikeScore: 0, // Points earned in this strike (1 per ball)
            matchScoreBefore: [this.players[0].matchScore.value, this.players[1].matchScore.value],
            totalScoreBefore: [this.players[0].totalScore.value, this.players[1].totalScore.value],
            foul: false,
            won: false,
            matchScoreAfter: null,
            totalScoreAfter: null
        };
    }
};
GamePolicy.prototype.drawScores = function(){
    Canvas2D.drawText("PLAYER " + (this.turn+1), new Vector2(Game.size.x/2 + 40,200), new Vector2(150,0), "#096834", "top", "Impact", "70px");
    this.players[0].totalScore.draw();
    this.players[1].totalScore.draw();

    this.players[0].matchScore.drawLines(this.players[0].color);
    this.players[1].matchScore.drawLines(this.players[1].color);
}

GamePolicy.prototype.checkColisionValidity = function(ball1,ball2){

    let currentPlayerColor = this.players[this.turn].color;

    if(this.players[this.turn].matchScore.value == 7 &&
       (ball1.color == Color.black || ball2.color == Color.black)){
        this.firstCollision = false;
        return;
       }

    if(!this.firstCollision)
        return;

    if(currentPlayerColor == undefined){
        this.firstCollision = false;
        return;
    }

    if(ball1.color == Color.white){
        if(ball2.color != currentPlayerColor){
            this.foul = true;
        }
        this.firstCollision = false;
    }

    if(ball2.color == Color.white){
        if(ball1.color != currentPlayerColor){
            this.foul = true;
        }
        this.firstCollision = false;
    }
}
GamePolicy.prototype.handleBallInHole = function(ball){

    setTimeout(function(){ball.out();}, 100);

    // Initialize current strike if not already done
    this.initializeCurrentStrike();

    let currentPlayer = this.players[this.turn];
    let secondPlayer = this.players[(this.turn+1)%2];

    if(currentPlayer.color == undefined){
        if(ball.color === Color.red){
            currentPlayer.color = Color.red;
            secondPlayer.color = Color.yellow;
        }
        else if(ball.color === Color.yellow){
            currentPlayer.color = Color.yellow;
            secondPlayer.color = Color.red;
        }
        else if(ball.color === Color.black){
            this.won = true; 
            this.foul = true;
        }
        else if(ball.color === Color.white){
            this.foul = true;
        }
    }

    if(currentPlayer.color === ball.color){
        currentPlayer.matchScore.increment();
        this.scored = true;
        this.validBallsInsertedOnTurn++;
        this.strikeScore += 1; // Add 1 point for each ball pocketed
        this.currentStrikeData.ballsPocketed.push({
            color: ball.color === Color.red ? 'red' : 'yellow',
            player: this.turn + 1,
            points: 1
        });
    }
    else if(ball.color === Color.white){

        if(currentPlayer.color != undefined){
            this.foul = true;

            let ballsSet = Game.gameWorld.getBallsSetByColor(currentPlayer.color);

            let allBallsInHole = true;

            for (var i = 0 ; i < ballsSet.length; i++){
                if(!ballsSet[i].inHole){
                    allBallsInHole = false;
                }
            }

            if(allBallsInHole){
                this.won = true;
            }
        }
    }
    else if(ball.color === Color.black){

        if(currentPlayer.color != undefined){
            let ballsSet = Game.gameWorld.getBallsSetByColor(currentPlayer.color);

            for (var i = 0 ; i < ballsSet.length; i++){
                if(!ballsSet[i].inHole){
                    this.foul = true;
                }
            }
            
            this.won = true;
        }
    }
    else{
        secondPlayer.matchScore.increment();
        this.foul = true;
        this.strikeScore += 1; // Add 1 point even if opponent pockets their ball (foul)
        this.currentStrikeData.ballsPocketed.push({
            color: ball.color === Color.red ? 'red' : 'yellow',
            player: (this.turn + 1) % 2 === 0 ? 2 : 1,
            points: 1
        });
    }
}

GamePolicy.prototype.switchTurns = function(){
    this.turn++;
    this.turn%=2;
}

GamePolicy.prototype.updateTurnOutcome = function(){
    
    if(!this.turnPlayed){
        return;
    }

    if(this.firstCollision == true){
        this.foul = true;
    }
    
    // Record strike data with score
    if(this.currentStrikeData){
        this.currentStrikeData.strikeScore = this.strikeScore; // Set final strike score (0 if no balls pocketed)
        this.currentStrikeData.foul = this.foul;
        this.currentStrikeData.won = this.won;
    }

    if(this.won){
        
        if(!this.foul){
            this.players[this.turn].totalScore.increment();
            if(this.currentStrikeData){
                this.currentStrikeData.matchScoreAfter = [this.players[0].matchScore.value, this.players[1].matchScore.value];
                this.currentStrikeData.totalScoreAfter = [this.players[0].totalScore.value, this.players[1].totalScore.value];
                this.strikeHistory.push(this.currentStrikeData);
                // Export JSON after each strike
                this.exportScoresToJSON();
            }
            if(AI.finishedSession){
                this.reset()
                setTimeout(function(){Game.gameWorld.reset();
                }, 1000);
            }
        }
        else{
            this.players[(this.turn+1)%2].totalScore.increment();
            if(this.currentStrikeData){
                this.currentStrikeData.matchScoreAfter = [this.players[0].matchScore.value, this.players[1].matchScore.value];
                this.currentStrikeData.totalScoreAfter = [this.players[0].totalScore.value, this.players[1].totalScore.value];
                this.strikeHistory.push(this.currentStrikeData);
                // Export JSON after each strike
                this.exportScoresToJSON();
            }
            if(AI.finishedSession){
                this.reset();
                setTimeout(function(){Game.gameWorld.reset();
                }, 1000);
            }
        }
        return;
    }

    if(!this.scored || this.foul){
        if(this.currentStrikeData){
            this.currentStrikeData.matchScoreAfter = [this.players[0].matchScore.value, this.players[1].matchScore.value];
            this.currentStrikeData.totalScoreAfter = [this.players[0].totalScore.value, this.players[1].totalScore.value];
            this.strikeHistory.push(this.currentStrikeData);
            // Export JSON after each strike
            this.exportScoresToJSON();
        }
        this.switchTurns();
    }
    else{
        if(this.currentStrikeData){
            this.currentStrikeData.matchScoreAfter = [this.players[0].matchScore.value, this.players[1].matchScore.value];
            this.currentStrikeData.totalScoreAfter = [this.players[0].totalScore.value, this.players[1].totalScore.value];
            this.strikeHistory.push(this.currentStrikeData);
            // Export JSON after each strike
            this.exportScoresToJSON();
        }
    }

    this.scored = false;
    this.turnPlayed = false;
    this.firstCollision = true;
    this.validBallsInsertedOnTurn = 0;
    this.currentStrikeData = null;
    this.strikeScore = 0; // Reset strike score for next strike

    setTimeout(function(){Game.gameWorld.whiteBall.visible=true;}, 200);

    if(AI_ON && this.turn === AI_PLAYER_NUM && AI.finishedSession){
        AI.startSession();
    }
}

GamePolicy.prototype.handleFoul = function(){

    if(!Mouse.left.down){
        Game.gameWorld.whiteBall.position = Mouse.position;
    }

}
GamePolicy.prototype.isXOutsideLeftBorder = function(pos, origin){
    return (pos.x - origin.x) < this.leftBorderX;
}
GamePolicy.prototype.isXOutsideRightBorder = function(pos, origin){
    return (pos.x + origin.x) > this.rightBorderX;
}
GamePolicy.prototype.isYOutsideTopBorder = function(pos, origin){
    return (pos.y - origin.y) < this.topBorderY;
}
GamePolicy.prototype.isYOutsideBottomBorder = function(pos , origin){
    return (pos.y + origin.y) > this.bottomBorderY;
}

GamePolicy.prototype.isOutsideBorder = function(pos,origin){
    return this.isXOutsideLeftBorder(pos,origin) || this.isXOutsideRightBorder(pos,origin) || 
    this.isYOutsideTopBorder(pos, origin) || this.isYOutsideBottomBorder(pos , origin);
}

GamePolicy.prototype.isInsideTopLeftHole = function(pos){
    return this.topLeftHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideTopRightHole = function(pos){
    return this.topRightHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideBottomLeftHole = function(pos){
    return this.bottomLeftHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideBottomRightHole = function(pos){
    return this.bottomRightHolePos.distanceFrom(pos) < HOLE_RADIUS;
}

GamePolicy.prototype.isInsideTopCenterHole = function(pos){
    return this.topCenterHolePos.distanceFrom(pos) < (HOLE_RADIUS + 6);
}

GamePolicy.prototype.isInsideBottomCenterHole = function(pos){
    return this.bottomCenterHolePos.distanceFrom(pos) < (HOLE_RADIUS + 6);
}

GamePolicy.prototype.isInsideHole = function(pos){
    return this.isInsideTopLeftHole(pos) || this.isInsideTopRightHole(pos) || 
           this.isInsideBottomLeftHole(pos) || this.isInsideBottomRightHole(pos) ||
           this.isInsideTopCenterHole(pos) || this.isInsideBottomCenterHole(pos);
}

GamePolicy.prototype.initiateState = function(policyState){

    this.turn = policyState.turn;
    this.firstCollision = policyState.firstCollision;
    this.foul = policyState.foul;
    this.scored = policyState.scored;
    this.won = policyState.won;
    this.turnPlayed = policyState.turnPlayed;
    this.validBallsInsertedOnTurn = policyState.validBallsInsertedOnTurn;

    this.players[0].totalScore.value = policyState.players[0].totalScore.value;
    this.players[1].totalScore.value = policyState.players[1].totalScore.value;

    this.players[0].matchScore.value = policyState.players[0].matchScore.value;
    this.players[0].color = policyState.players[0].color;
    this.players[1].matchScore.value = policyState.players[1].matchScore.value;
    this.players[1].color = policyState.players[1].color;

}

GamePolicy.prototype.exportScoresToJSON = function(){
    
    if(this.strikeHistory.length === 0){
        console.log("No strike data to export");
        return;
    }
    
    // Determine game mode (pvp = Player vs Player, pvc = Player vs Computer)
    const gameMode = AI_ON ? 'pvc' : 'pvp';
    
    let gameData = {
        gameMode: gameMode,
        gameDate: new Date().toISOString(),
        totalStrikes: this.strikeHistory.length,
        totalStrikeScore: this.strikeHistory.reduce((sum, strike) => sum + strike.strikeScore, 0),
        finalScores: {
            player1: {
                matchScore: this.players[0].matchScore.value,
                totalScore: this.players[0].totalScore.value,
                color: this.players[0].color,
                totalPointsScored: this.strikeHistory
                    .filter(strike => strike.player === 1)
                    .reduce((sum, strike) => sum + strike.strikeScore, 0)
            },
            player2: {
                matchScore: this.players[1].matchScore.value,
                totalScore: this.players[1].totalScore.value,
                color: this.players[1].color,
                isAI: AI_ON,
                totalPointsScored: this.strikeHistory
                    .filter(strike => strike.player === 2)
                    .reduce((sum, strike) => sum + strike.strikeScore, 0)
            }
        },
        strikes: this.strikeHistory
    };
    
    let jsonString = JSON.stringify(gameData, null, 2);
    console.log("Strike #" + this.strikeHistory.length + " Score: " + (this.strikeHistory[this.strikeHistory.length - 1]?.strikeScore || 0) + " points");
    
    // Store in localStorage for persistence
    try {
        localStorage.setItem('poolGameScores', jsonString);
        console.log("Score data saved to localStorage");
    } catch(e) {
        console.log("Could not save to localStorage: " + e);
    }
    
    // Send to server to save as actual file
    this.saveScoreToServer(gameData);
}

GamePolicy.prototype.saveScoreToServer = function(gameData){
    
    fetch('http://localhost:3000/api/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.success){
            console.log("✓ JSON file saved to disk: " + data.filepath);
        }
        else{
            console.log("Server response: " + data.message);
        }
    })
    .catch(error => {
        console.log("Could not save to server. Make sure server is running on port 3000");
        console.log("Run: npm install && npm start");
    });
}

GamePolicy.prototype.downloadJSON = function(jsonData, filename){
    
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    console.log("Score data exported to: " + filename);
}

GamePolicy.prototype.getFinalGameDataForDownload = function(){
    
    if(this.strikeHistory.length === 0){
        return null;
    }
    
    let gameData = {
        gameDate: new Date().toISOString(),
        totalStrikes: this.strikeHistory.length,
        totalStrikeScore: this.strikeHistory.reduce((sum, strike) => sum + strike.strikeScore, 0),
        finalScores: {
            player1: {
                matchScore: this.players[0].matchScore.value,
                totalScore: this.players[0].totalScore.value,
                color: this.players[0].color,
                totalPointsScored: this.strikeHistory
                    .filter(strike => strike.player === 1)
                    .reduce((sum, strike) => sum + strike.strikeScore, 0)
            },
            player2: {
                matchScore: this.players[1].matchScore.value,
                totalScore: this.players[1].totalScore.value,
                color: this.players[1].color,
                totalPointsScored: this.strikeHistory
                    .filter(strike => strike.player === 2)
                    .reduce((sum, strike) => sum + strike.strikeScore, 0)
            }
        },
        strikes: this.strikeHistory
    };
    
    let jsonString = JSON.stringify(gameData, null, 2);
    this.downloadJSON(jsonString, 'pool_game_scores.json');
}