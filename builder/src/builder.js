const fs = require("fs").promises;

module.exports = async ({ exec }) => {

    const DEFAULT_BUILD_DIR = "/tmp/mic-build";
    const FRAGMENTS = ["cc", "boot", "kernel", "root", "installer"];

    return {

        DEFAULT_BUILD_DIR,
        FRAGMENTS,

        async run({
            installerImage,
            layers,
            buildDir = DEFAULT_BUILD_DIR,
            stopAt
        }) {

            console.info(`Building ${installerImage}`);
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

                async function scanAppends(dir) {
                    for (let file of await fs.readdir(dir)) {
                        let path = dir + "/" + file;
                        try {
                            let stat = await fs.stat(path);
                            if (stat.isDirectory()) {
                                await scanAppends(path);
                            } else if (stat.isFile() && path.endsWith(".append")) {
                                let data = await fs.readFile(path);
                                let handle = await fs.open(path.replace(/\.append$/, ""), "a");
                                try {
                                    await handle.write(data);
                                } finally {
                                    await handle.close();
                                }
                                await fs.unlink(path);
                            }
                        } catch (e) {
                            if (e.code !== "ENOENT") {
                                throw e;
                            }
                        }
                    }
                }

                await scanAppends(buildDir);

            }

            layers = ["base", ...layers];
            for (let layer of layers) {
                await applyLayer(layer);
            }

            try {
                await fs.unlink(buildDir + "/layer-deps");
            } catch (e) {
                if (e.code !== "ENOENT") {
                    throw e;
                }
            }

            let buildVars = {
                BOARD_ID: installerImage
            };

            for (let varFile of await fs.readdir(buildDir)) {
                if (varFile.match(/^\[[A-Z0-9_]+\]$/)) {
                    let key = varFile.substring(1).substring(0, varFile.length - 2);
                    let path = buildDir + "/" + varFile;
                    let value = (await fs.readFile(path, "utf-8")).trim();
                    buildVars[key] = value;
                    await fs.unlink(path);
                }
            }

            console.info("Build variables:");
            for (let key in buildVars) {
                console.info(` ${key}=${buildVars[key]}`);
            }

            let files = await fs.readdir(buildDir);
            let content = "";
            for (let fragment of FRAGMENTS) {
                content += `
##############################################
# ${fragment}
##############################################

`;
                let fragmentFiles = files.filter(file => file.startsWith(`Dockerfile-${fragment}`)).sort();
                for (let fragmentFile of fragmentFiles) {
                    let path = buildDir + "/" + fragmentFile;
                    content += await fs.readFile(path, "utf-8");
                    await fs.unlink(path);
                }

                if (stopAt === fragment) {
                    break;
                }
            }

            for (let key in buildVars) {
                content = content.replace(new RegExp("\\$\\{" + key + "\\}", "g"), buildVars[key]);
            }

            content += Object.entries(buildVars).reduce((acc, [key, value]) => acc + "LABEL build." + key.toLowerCase().replace(/_/g, ".") + "=\"" + value + "\"\n", "")

            await fs.writeFile(buildDir + "/Dockerfile", content, "utf-8");

            console.info(`Build context ready in ${buildDir}`);

            if (!stopAt) {

                await exec("docker", [
                    "buildx",
                    "build",
                    "--progress=plain",
                    "--load",
                    buildDir,
                    "-t",
                    installerImage
                ]);

            }
        }

    }
}