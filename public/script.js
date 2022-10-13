const socket = io({ transports: ['websocket'], path: '/ktools/socket.io' });

function uploadTEX(files) {
    socket.emit("uploadTEX", files[0], (result) => {
        if (result.includes('Error:')) return alert(result);
        var elem = document.createElement('a');
        elem.setAttribute('href', 'data:image/png;base64,' + result);
        elem.setAttribute('download', `${files[0].name.split('.tex')[0]}.png`);
        elem.style.display = 'none';
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    });
}

function uploadBIN(files) {
    socket.emit("uploadBIN", files[0], (result) => {
        if (result.includes('Error:')) return alert(result);
        var elem = document.createElement('a');
        elem.setAttribute('href', 'data:image/png;base64,' + result);
        elem.setAttribute('download', `${files[0].name.split('.zip')[0]}.zip`);
        elem.style.display = 'none';
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    });
}