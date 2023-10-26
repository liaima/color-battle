if(localStorage.getItem('color-battle-admin')){
    const ws = new WebSocket(`ws://${window.document.location.host}`);
    ws.binaryType = "blob";
    // Log socket opening and closing
    ws.addEventListener("open", event => {
        console.log("Websocket connection opened");
        ws.send(JSON.stringify({
            type: 'connection',
            user: 'admin'
        }));
    });
    ws.addEventListener("close", event => {
        console.log("Websocket connection closed");
    });
    ws.onmessage = function (message) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('msgCtn');
        if (message.data instanceof Blob) {
            reader = new FileReader();
            reader.onload = () => {
                msgDiv.innerHTML = reader.result;
                document.getElementById('messages').appendChild(msgDiv);
                console.log(reader.result)
            };
            reader.readAsText(message.data);
        } else {
            const data = JSON.parse(message.data)
            if(data.type === "init"){
                console.info(data.message)
                document.getElementById('redProg').max = data.maxScore;
                document.getElementById('greenProg').max = data.maxScore;
                setTeamsValues(data)
            } else if ( data.type === 'teams_data' ) {
                setTeamsValues(data)
            } else if ( data.type === 'winner' ) {
                const loser = document.getElementById(data.game.loser + 'Prog')
                loser.value = 0;
                const winValue = data.winner.toUpperCase()
                showOverlay(`<p>${winValue} WINS!!</p><button class="btn btn-sm" onClick="closeOverlay()">Close</button>`)
             } else if ( data.type === 'pause' ) {
                const pauseBtn = document.getElementById('pause-btn');
                 if(data.game.status === 'pause'){
                     pauseBtn.innerHTML = 'Un Pause'
                 }else{
                     pauseBtn.innerHTML = 'Pause'
                 }
             }
         }
     }
    document.getElementById('reset').addEventListener('click', (e) => {
         reset()
    })

    document.getElementById('pause-btn').addEventListener('click', (e) => {
         pause()
    })

    const ipInput = document.getElementById('ip-input')
    if(ipInput.value){
        makeQr(ipInput.value)
    }
    document.getElementById('set-ip-btn').addEventListener('click', (e) => {
        makeQr(ipInput.value)
    })

    document.getElementById('set-max-score-btn').addEventListener('click', (e) => {
        console.log('max')
        setMaxScore(document.getElementById('max-score-input').value)
    })
   
    function setTeamsValues(data)
    {
        document.getElementById('redProg').value = data.teams.red.score;
        document.getElementById('greenProg').value = data.teams.green.score;
        console.info('Red: ' + data.teams.red.score)
        console.info('Green: ' + data.teams.green.score)
    }

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

    function makeQr(ip)
    {
        new QRCode(document.getElementById("qrcode"), `http://${ip}`);
    }

    function setMaxScore(maxScore)
    {
        ws.send(JSON.stringify({
            type: 'set-max_score',
            maxScore
        }));
        reset()
    }

    function reset()
    {
        console.log("Reset");
        ws.send(JSON.stringify({
            type: 'reset'
        }));
        location.reload()
    }

    function pause()
    {
        ws.send(JSON.stringify({
            type: 'pause'
        }))
    }

} else {
    alert('Permission denied')
    document.getElementById('main').style.display = 'none';
    document.getElementById('notPermission').style.display = 'block';
}
