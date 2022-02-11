const fs = require("fs").promises;

module.exports = async ({ builder, exec }) => {

    const profiles = [        
        {
            tag: "base",
            prefix: "ghcr.io/device-farm/",
            layers: ["dropbear", "avahi", "df-wireguard"]
        },
        {
            tag: "docker",
            prefix: "ghcr.io/device-farm/",
            layers: ["dropbear", "avahi", "df-wireguard", "df-docker"]
        }
    ]

    return {
        name: "all",
        description: "builds all installers of MIC Linux",
        define(program) {
            program
                // .option("-B, --build-dir <dir>", `directory for docker build context; defaults to ${builder.DEFAULT_BUILD_DIR}`)
                // .option("-S, --stop-at <place>", `where to stop: ${[...builder.FRAGMENTS, "build"].join(", ")}`)
        },

        async run({}) {

            let boards = [];

            async function findBoards(dir) {
                for (let file of await fs.readdir(dir)) {
                    let path = dir + "/" + file;
                    try {
                        let stat = await fs.stat(path);
                        if (stat.isDirectory()) {
                            await findBoards(path);
                        } else if (stat.isFile() && file === "[BOARD_NAME]") {
                            boards.push(dir.replace(/.*\//, ""));
                        }
                    } catch (e) {
                        if (e.code !== "ENOENT") {
                            throw e;
                        }
                    }
                
                }
            }

            await findBoards(__dirname + "/../../layers");

            for (let board of boards) {
                for (let profile of profiles) {                    
                    let installerImage = profile.prefix + board + ":" + profile.tag;
                    await builder.run({
                        installerImage,
                        layers: [board, ...profile.layers]
                    });
                    await exec("docker", ["push", installerImage]);
                }
            }

        }
    }
}