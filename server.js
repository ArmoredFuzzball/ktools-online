const express = require('express');
const compress = require('compression-next');
const fileUpload = require('express-fileupload');
const { readFileSync, writeFile, unlinkSync, rmdirSync } = require('fs');
const { spawn } = require('node:child_process');
const app = express();

const port = 8065;
const path = '/ktools';

app.use(compress({ threshold: 500 }));
app.use(path, express.static('public'));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

app.listen(port, () => console.log(`listening on port ${port}`));

let metrics = JSON.parse(readFileSync(__dirname + '/public/metrics.txt'));

app.get(path, (_, res) => {
    metrics.views++;
    res.sendFile(__dirname + '/index.html');
});

//tex to png
app.post(path + '/tex', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send('No file was uploaded.');
    let file       = req.files.file;
    let extension  = file.name.split('.').pop();
    let name       = Math.floor(Math.random() * 1000000);
    if (extension !== 'tex') return res.status(415).send('File type must be .tex or .zip.');

    file.mv(__dirname + '/convert/' + name + '.tex');

    let command = spawn('docker', ['run', '--rm', '-u', 'ktools', '-iv', __dirname + '/convert/:/data/', 'dstmodders/ktools']);
    command.stdin.write(`ktech /data/${name}.tex`);
    command.stdin.end();

    command.on('close', (err) => {
        if (err) {
            metrics.texerrs++;
            unlinkSync(__dirname + '/convert/' + name + '.tex');
            return res.status(500).send('ktech cannot process the file.');
        }
        let data = readFileSync(__dirname + '/convert/' + name + '.png');
        let base64 = Buffer.from(data).toString('base64');
        res.status(200).send(base64);
        unlinkSync(__dirname + '/convert/' + name + '.tex');
        unlinkSync(__dirname + '/convert/' + name + '.png');
        metrics.texuses++;
    });
});

//anim zip to scml project
app.post(path + '/zip', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send('No file was uploaded.');
    let file       = req.files.file;
    let extension  = file.name.split('.').pop();
    let name       = Math.floor(Math.random() * 1000000);
    if (extension !== 'zip') return res.status(415).send('File type must be .tex or .zip.');

    file.mv(`${__dirname}/convert/${name}.zip`);

    let command = spawn('docker', ['run', '--rm', '-u', 'ktools', '-iv', __dirname + `/convert/:/data/`, 'dstmodders/ktools']);
    command.stdin.write(
        `mkdir ${name};
        mv ${name}.zip ${name}/in.zip; 
        cd ${name};
        unzip in.zip;
        krane . export/;
        tar -zcvf ../${name}.tar.gz export/;
        cd ..; 
        rm -rf ${name};`
    );
    //gotta use tar because the ktools docker container has no zip package
    command.stdin.end();

    command.on('close', (err) => {
        if (err) {
            metrics.scmlerrs++;
            rmdirSync(__dirname + '/convert/' + name, (err) => { if (err) console.error(err) });
            return res.status(500).send('krane cannot process the file.');
        }
        let data = readFileSync(__dirname + '/convert/' + name + '.tar.gz');
        let base64 = Buffer.from(data).toString('base64');
        res.status(200).send(base64);
        unlinkSync(__dirname + '/convert/' + name + '.tar.gz');
        metrics.scmluses++;
    });
});

setInterval(() => {
    metrics.uptime = metrics.uptime + 5;
    writeFile(__dirname + '/public/metrics.txt', JSON.stringify(metrics), (err) => { if (err) console.error(err) });
}, 5000);