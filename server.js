const { start } = require("./builder.js");
const { writeFileSync, readFileSync, unlinkSync, rmSync } = require("fs");
const { spawnSync } = require("child_process");
const io = start();

var metrics = JSON.parse(readFileSync('metrics.txt'));

io.on("connection", (socket) => {
    metrics.views++;
    socket.on("uploadTEX", (file, cb) => TEXtoPNG(socket.id, file, cb));
    socket.on("uploadBIN", (file, cb) => BINtoSCML(socket.id, file, cb));
});

function TEXtoPNG(id, file, cb) {
    try {
        writeFileSync(`./upload/${id}.tex`, file);
        const string = `ktech -q ${id}.tex; rm ${id}.tex`;
        spawnSync(string, { cwd: './upload', shell: true });
        const output = readFileSync(`./upload/${id}.png`);
        unlinkSync(`./upload/${id}.png`);
        metrics.texuses++;
        cb(output.toString('base64'));
    } catch (e) {
        metrics.texerrs++;
        console.error(e);
        try { unlinkSync(`./upload/${id}.tex`) } catch { };
        cb("Error: something went wrong on our end.");
    };
}

function BINtoSCML(id, file, cb) {
    try {
        writeFileSync(`./upload/${id}.zip`, file);
        const string = `
            unzip ./${id}.zip -d ./${id};
            rm ./${id}.zip;
            krane ./${id} ./${id}/export;
            cd ./${id};
            zip -r ./export.zip ./export;
        `;
        spawnSync(string, { cwd: './upload', shell: true });
        const output = readFileSync(`./upload/${id}/export.zip`);
        rmSync(`./upload/${id}/`, { recursive: true, force: true });
        metrics.scmluses++;
        cb(output.toString('base64'));
    } catch (e) {
        metrics.scmlerrs++;
        console.error(e);
        try { unlinkSync(`./upload/${id}.zip`) } catch { };
        try { rmSync(`./upload/${id}/`, { recursive: true, force: true }) } catch { };
        cb("Error: something went wrong on our end.");
    };
}

setInterval(() => {
    metrics.uptime += 10;
    writeFileSync('metrics.txt', JSON.stringify(metrics, null, 4));
}, 1000 * 10);