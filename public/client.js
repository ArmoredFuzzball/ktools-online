window.addEventListener('load', () => {
    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data    = new FormData(form);
        const request = new XMLHttpRequest();

        if (!data.get('file').name) return alert('No file was uploaded.');
        const filename  = data.get('file').name.split('.').slice(0, -1).join('.');
        const extension = data.get('file').name.split('.').pop();
        if (extension !== 'tex' && extension !== 'zip') return alert('File type must be .tex or .zip.');

        // when the upload is in progress
        request.upload.addEventListener('progress', (event) => {
            const percent = (event.loaded / event.total) * 100;
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
            const base64 = res.target.response;
            const link = document.createElement('a');
            if (extension === 'tex') {
                link.href = `data:image/png;base64,${base64}`;
                link.download = `${filename}-decompiled.png`;
            } else if (extension === 'zip') {
                link.href = `data:application/gzip;base64,${base64}`;
                link.download = `${filename}-decompiled.tar.gz`;
            }
            link.click();
        });
        
        request.open('POST', `./${extension}`);
        request.send(data);
    });
});