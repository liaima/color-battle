import { createServer } from 'http';
import staticHandler from 'serve-handler';
import ws, { WebSocketServer } from 'ws';
//serve static folder
const server = createServer((req, res) => {   // (1)
    return staticHandler(req, res, { public: 'public' })
});
const wss = new WebSocketServer({ server }) // (2)
const admins = []
const game = {
    status: 'in_process',
    max_score: 100,
    winner: null,
    loser: null
}
const teams = {
    'red': {
        'score': game.max_score,
        'members': []
    },
    'green': {
        'score': game.max_score,
        'members': []
    }
}

wss.on('connection', (client) => {
    console.log('Client connected !')
    client.on('error', console.error);
    client.on('close', (e) => {
        const removed = removeClient(client)
        console.log('Cliente eliminado: ' + removed)
    });
    client.on('message', (msg) => {    // (3)
        console.log(`Message:${msg}`);
        const data = JSON.parse(msg);
        if( data.type === 'attack' ){
            console.log(data)
            const winner = scoreUp(data.team, data.value)
            let adminData = {};
            if(!winner){
               adminData = {
                    type: 'teams_data',
                    teams
                } 
            }else{
                setWinner(winner);
                adminData = {
                    type: 'winner',
                    game,
                    winner
                }
                const clients = [...teams.red.members, ...teams.green.members] 
                const msg = JSON.stringify({
                    type: 'winner',
                    game,
                    winner
                })
                broadcast(msg, clients)
            }
            
            broadcastAdmin(JSON.stringify(adminData))

        } else if ( data.type === 'connection' ) {
            if (data.user === 'player'){
                const asignedTeam = selectTeam(client);
                console.log(teams);
                const init = {
                    type: "init",
                    message: "init test",
                    team: asignedTeam,
                    maxScore: game.max_score,
                    game,
                }
                client.send(JSON.stringify(init))
            } else if ( data.user === 'admin' ) {
                admins.push(client)
                const init = {
                    type: "init",
                    message: "init test",
                    maxScore: game.max_score,
                    game,
                    teams
                }
                client.send(JSON.stringify(init))
            }
        } else if ( data.type === 'reset') {
            reset()
            const adminData = {
                 type: 'teams_data',
                 teams
             } 
            broadcastAdmin(JSON.stringify(adminData))
            const clients = [...teams.red.members, ...teams.green.members] 
            const msg = JSON.stringify({
                type: 'reset'
            })
            broadcast(msg, clients)
        } else if ( data.type === 'set-max_score' ) {
            game.max_score = data.maxScore;
            teams.green.score = game.max_score;
            teams.red.score = game.max_score;
        } else if ( data.type === 'pause') {
            if(game.status === 'in_process'){
                game.status = 'pause'
            }else if(game.status === 'pause'){
                game.status = 'in_process'
            }
            const clients = [...teams.red.members, ...teams.green.members] 
            const msg = JSON.stringify({
                type: 'pause',
                game,
            })
            broadcast(msg, clients)
            broadcastAdmin(msg)


        }
        console.log(teams)
        //broadcast(msg)
    })
})
wss.on('close', (client) => {
    console.log('Client DISconnected !')
})

function broadcastAdmin(msg) {       // (4)
    console.log('admins: ' + admins)
    for (const client of admins) {
        if (client.readyState === ws.OPEN) {
            client.send(msg)
        }
    }
}

function broadcast(msg, clients) {       // (4)
    for (const client of clients) {
        if (client.readyState === ws.OPEN) {
            client.send(msg)
        }
    }
}

function selectTeam(client){
    if(teams.red.members.length > teams.green.members.length){
        teams.green.members.push(client)
        return 'green'
    } else {
        teams.red.members.push(client)
        return 'red'
    }
}

function removeClient(client){
    let index = teams.red.members.indexOf(client);
    if ( index >= 0 ) {
        teams.red.members.splice(index, 1);
        return true;
    }
    index = teams.green.members.indexOf(client);
    if ( index >= 0 ) {
        teams.green.members.splice(index, 1);
        return true;
    }
    index = admins.indexOf(client)
    if( index >= 0 ) {
        admins.splice(index, 1);
        return true;
    }
    return false;
}

function scoreUp(team, value)
{
    if ( team === 'green' ) {
        teams.red.score -= parseInt(value)
        if (teams.red.score <= 0){
            return team
        }
    } else if ( team === 'red' ) {
        teams.green.score -= parseInt(value)
        if (teams.green.score <= 0){
            return team
        }
    }

    return false;
}

function reset()
{
    teams.red.score = game.max_score
    teams.green.score = game.max_score
    game.status = 'in_process'
    game.winner = null
    game.loser = null
}

function setWinner(winner)
{
    game.winner = winner;
    game.status = 'finished';
    if(winner === 'red'){
        game.loser = 'green'
    } else {
        game.loser = 'red'
    }

}

const port = process.argv[2] || 8080;
server.listen(port, () => {
    console.log(`server listening on port ${port}`);
})
