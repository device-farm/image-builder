const fs = require("fs").promises;

module.exports = async ({ exec }) => {

    const DEFAULT_BUILD_DIR = "/tmp/mic-build";

    return {
        name: "build <installer-image> <layers...>",
        description: "builds MIC Linux",
        define(program) {
            program
                .option("-B, --build-dir <build-dir>", `directory for docker build context; defaults to ${DEFAULT_BUILD_DIR}`)
            // .option("-D, --dry", "dry run - show docker command line only")
            // .option("-w, --wifi <ssid:password>", "pre-configures WiFi connection")
            // .option("-s, --ssh <pub-key-file>", "installs public SSH key for user root\nuse - as shorthand for ~/.ssh/id_rsa.pub")
            // .option("-r, --root <overlay-dir>", "root overlay directory")
            // .option("-t, --dto <dto-dir>", "device tree overlay directory")
            // .option("-i, --installer <installer-image>", "installer docker image")
            // .on("--help", () => {
            //     console.info();
            //     console.info("<blk-device> is SD card block device under /dev e.g. /dev/mmcblk0");
            // });
        },

        async run(installerImage, layers, { buildDir = DEFAULT_BUILD_DIR }) {

            console.info(`Building ${installerImage} in ${buildDir}`);
            await exec("rm", ["-rf", buildDir]);
            await exec("mkdir", ["-p", buildDir]);

            async function applyLayer(layerName) {

                let layerDir;
                if (layerName.indexOf("/") === -1) {
                    layerDir = `${__dirname}/../../layers/${layerName}`;
                } else {
                    layerDir = layerName;
                    layerName = layerName.replace(/.*\//);
                }

                let layers = [];
                try {
                    layers = (await fs.readFile(`${layerDir}/layer-deps`, "utf-8"))
                        .split("\n")
                        .map(s => s.replace(/#.*/, "").trim())
                        .filter(s => s);
                } catch (e) {
                    if (e.code !== "ENOENT") {
                        throw e;
                    }
                }

                for (let layer of layers) {
                    await applyLayer(layer);
                }

                console.info(`Applying layer ${layerName}`);
                await exec("cp", ["-r", layerDir + "/.", buildDir]);

            }

            for (let layer of layers) {
                await applyLayer(layer);
            }

        }
    }
}