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
            document.getElementById('teamColor').style.background = team;
        } else if ( data.type === 'winner' ){
            const winMessage = document.getElementById('win-message')
            winMessage.style.display = 'flex';
            winMessage.style.alignItems = 'center';
            winMessage.style.justifyContent = 'center';
            if(team === data.winner){
                winMessage.innerHTML = '<p>YOU WIN!!</p>'
            } else {
                winMessage.innerHTML = '<p>YOU LOSE!!</p>'
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

