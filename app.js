const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DataBase Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

/*const convertPlayerMatchDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};*/

const convertMatchDBObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//GET

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * 
    FROM player_details`;

  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDBObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT * 
    FROM player_details
    WHERE player_id = ${playerId};`;

  const player = await db.get(getPlayersQuery);
  response.send(convertPlayerDBObjectToResponseObject(player));
});
//Put UpdTE

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const putPlayersQuery = `
    UPDATE 
    player_details
    SET 
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};`;
  const playerResponse = await db.run(putPlayersQuery);
  response.send("Player Details Updated");
});

//GET MatchId

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * 
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchDBObjectToResponseObject(match));
});
// GET METHOD

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
  SELECT 
  match_details.match_id,
  match_details.match,
  match_details.year
  FROM
  match_details NATURAL JOIN player_match_score
  WHERE 
  player_id = ${playerId};`;
  const playerMatch = await db.all(playerMatchQuery);
  response.send(
    playerMatch.map((eachOne) => convertMatchDBObjectToResponseObject(eachOne))
  );
});

//GET
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
  SELECT 
  player_details.player_id,
  player_details.player_name
  
  FROM
  player_details NATURAL JOIN player_match_score
  WHERE 
  match_id = ${matchId};`;
  const playerMatchDetails = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchDetails.map((eachOne) =>
      convertPlayerDBObjectToResponseObject(eachOne)
    )
  );
});

//
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchGetQuery = `
  SELECT 
  player_details.player_id,
  player_details.player_name,
  SUM(player_match_score.score),
  SUM(player_match_score.fours),
  SUM(player_match_score.sixes)
  
  FROM
  player_details NATURAL JOIN player_match_score
  WHERE 
  player_id = ${playerId};`;
  const playerMatchDetails = await db.get(playerMatchGetQuery);
  response.send({
    playerId: playerMatchDetails.player_id,
    playerName: playerMatchDetails.player_name,
    totalScore: playerMatchDetails["SUM(player_match_score.score)"],
    totalFours: playerMatchDetails["SUM(player_match_score.fours)"],
    totalSixes: playerMatchDetails["SUM(player_match_score.sixes)"],
  });
});
module.exports = app;
