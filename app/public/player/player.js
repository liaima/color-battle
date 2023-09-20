const ws = new WebSocket(`ws://${window.document.location.host}`);
let team = '';
ws.binaryType = "blob";
// Log socket opening and closing
ws.addEventListener("open", event => {
    console.log("Websocket connection opened");
    ws.send(JSON.stringify({
        type: 'connection',
        user: 'player'
    }));
});
ws.addEventListener("close", event => {
    console.log("Websocket connection closed");
});
ws.onmessage = function (message) {
    if (message.data instanceof Blob) {
        reader = new FileReader();
        reader.onload = () => {
            console.log(reader.result)
        };
        reader.readAsText(message.data);
    } else {
        const data = JSON.parse(message.data)
        console.info(data)
        if(data.type === "init"){
            console.info(data.message)
            team = data.team
            if(data.game.status === 'finished'){
                showOverlay('GAME FINSHED')
            } else if (data.game.status === 'pause'){
                showOverlay('<p>Game Paused</p>')
            }
            document.getElementById('teamColor').style.background = team;
        } else if ( data.type === 'winner' ){
            if(team === data.winner){
                showOverlay('<p>YOU WIN!!</p>')
            } else {
                showOverlay('<p>YOU LOSE!!</p>')
            }
        } else if ( data.type === 'reset' ) {
            location.reload()
        } else if ( data.type === 'pause' ) {
            if(data.game.status === 'pause'){
                showOverlay('<p>Game Paused</p>')
            }else{
               closeOverlay() 
            }
        }
        console.log("Result2: " + message.data);
    }
}

const btn = document.getElementById('att-btn');
btn.addEventListener('click', (event) => {
    event.preventDefault();
    const data = {
        type: 'attack',
        message: '',
        team
    }
    ws.send(JSON.stringify(data));
})

function showOverlay(msg)
{
    const overlay = document.getElementById('overlay')
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    overlay.innerHTML = msg

}

function closeOverlay()
{
    console.log('close')
    const overlay = document.getElementById('overlay')
    overlay.style.display = 'none';
}


