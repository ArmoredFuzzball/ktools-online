const express    = require('express');
const compress   = require('compression-next');
const fileUpload = require('express-fileupload');
const { spawn }  = require('child_process');
const { readFileSync, unlinkSync } = require('fs');
const app = express();

const port = 8065;
const path = '/ktools';

app.use(compress({ threshold: 1000 }));
app.use(path, express.static('public'));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));

app.listen(port, () => console.log(`listening on port ${port}`));

//tex to png
app.post(path + '/tex', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send('No file was uploaded.');
    const file = req.files.file;
    const extension = file.name.split('.').pop();
    if (!extension || extension !== 'tex') return res.status(415).send('File type must be .tex or .zip.');
    const name = Math.floor(Math.random() * 1000000);

    await file.mv(`${__dirname}/convert/${name}.tex`);

    const command = spawn('docker', ['run', '--rm', '-u', 'ktools', '-iv', `${__dirname}/convert/:/data/`, 'dstmodders/ktools']);
    command.stdin.write(`ktech ./${name}.tex; rm ./${name}.tex;`);
    command.stdin.end();

    command.stderr.on('data', (err) => console.error(err));

    command.on('close', (e) => {
        if (e) return res.status(500).send('ktech cannot process the file.');
        const data   = readFileSync(`${__dirname}/convert/${name}.png`);
        const base64 = Buffer.from(data).toString('base64');
        unlinkSync(`${__dirname}/convert/${name}.png`);
        res.status(200).send(base64);
    });
});

//anim zip to scml project
app.post(path + '/zip', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) return res.status(400).send('No file was uploaded.');
    const file = req.files.file;
    const extension = file.name.split('.').pop();
    if (!extension || extension !== 'zip') return res.status(415).send('File type must be .tex or .zip.');
    const name = Math.floor(Math.random() * 1000000);

    await file.mv(`${__dirname}/convert/${name}.zip`);

    const command = spawn('docker', ['run', '--rm', '-u', 'ktools', '-iv', `${__dirname}/convert/:/data/`, 'dstmodders/ktools']);
    command.stdin.write(`unzip ./${name}.zip -d ./${name}/; rm ./${name}.zip;`);
    command.stdin.write(`krane ./${name} ./${name}/export/; tar -czvf ./${name}.tar.gz -C ./${name}/export/ .;`);
    command.stdin.write(`rm -rf ./${name}/;`);
    command.stdin.end();

    command.stderr.on('data', (err) => console.error(err));

    command.on('close', (e) => {
        if (e) return res.status(500).send('krane cannot process the file.');
        const data   = readFileSync(`${__dirname}/convert/${name}.tar.gz`);
        const base64 = Buffer.from(data).toString('base64');
        unlinkSync(`${__dirname}/convert/${name}.tar.gz`);
        res.status(200).send(base64);
    });
});