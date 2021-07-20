const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerstoObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertmatchestoObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertscorestoObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  };
};

/// GET PLAYERS

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    select * 
    from 
    player_details
    order by player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerstoObject(eachPlayer))
  );
});

/// GET PLAYER WITH ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select *
    from player_details
    where player_id = ${playerId};`;
  const playerArray = await db.get(getPlayerQuery);
  response.send(convertPlayerstoObject(playerArray));
});

/// Update player with ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putPlayerQuery = `
    update player_details
    set 
    player_name = '${playerName}'
    where player_id = ${playerId};`;
  await db.get(putPlayerQuery);
  response.send("Player Details Updated");
});

/// GET match with ID

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select *
    from match_details
    where match_id = ${matchId};`;
  const matchArray = await db.get(getMatchQuery);
  response.send(convertmatchestoObject(matchArray));
});

/// GET PLAYER MATCHES WITH ID

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    select match_details.match_id, match_details.match, match_details.year
    from match_details left join player_match_score
    on match_details.match_id = player_match_score.match_id
    where player_id = ${playerId};`;
  const playerMatchesArray = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatchesArray.map((eachMatch) => convertmatchestoObject(eachMatch))
  );
});

/// GET player from matches with ID

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsMatchesQuery = `
    select player_details.player_id, player_details.player_name
    from player_details left join player_match_score
    on player_details.player_id = player_match_score.player_id
    where match_id = ${matchId};`;
  const playerDetailsMatchesArray = await db.all(getPlayerDetailsMatchesQuery);
  response.send(
    playerDetailsMatchesArray.map((eachMatch) =>
      convertPlayerstoObject(eachMatch)
    )
  );
});

/// GET PLAYER SCORES

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    select player_details.player_id, player_details.player_name, SUM(player_match_score.score) as totalScore, SUM(player_match_score.fours) as totalFours, SUM(player_match_score.sixes) as totalSixes
    from player_details left join player_match_score
    on player_details.player_id = player_match_score.player_id
    where player_match_score.player_id = ${playerId};`;
  const playerScoresArray = await db.get(getPlayerScoresQuery);
  response.send(convertscorestoObject(playerScoresArray));
});

module.exports = app;
