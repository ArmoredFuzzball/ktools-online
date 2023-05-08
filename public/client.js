window.addEventListener('load', () => {
    let form = document.getElementById('uploadForm');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let data    = new FormData(form);
        let request = new XMLHttpRequest();

        if (!data.get('file').name) return alert('No file was uploaded.');
        let filename  = data.get('file').name.split('.').slice(0, -1).join('.');
        let extension = data.get('file').name.split('.').pop();
        if (extension !== 'tex' && extension !== 'zip') return alert('File type must be .tex or .zip.');

        // when the upload is in progress
        request.upload.addEventListener('progress', (event) => {
            let percent = (event.loaded / event.total) * 100;
            document.getElementById('progressNumber').innerHTML = percent.toFixed(0) + '%';
            if (percent == 100) document.getElementById('progressNumber').innerHTML = 'Uploaded! Converting...';
        });

        // when the upload is done
        request.addEventListener('load', (res) => {
            if (res.target.status !== 200) {
                document.getElementById('progressNumber').innerHTML = 'Error!';
                return alert(res.target.response);
            }
            document.getElementById('progressNumber').innerHTML = 'Downloading!';
            if (extension === 'tex') {
                let base64 = res.target.response;
                let link = document.createElement('a');
                link.href = 'data:image/png;base64,' + base64;
                link.download = filename + '.png';
                link.click();
            } else if (extension === 'zip') {
                let base64 = res.target.response;
                let link = document.createElement('a');
                link.href = 'data:application/gzip;base64,' + base64;
                link.download = filename + '.tar.gz';
                link.click();
            }
        });
        
        request.open('POST', `./${extension}`);
        request.send(data);
    });
});