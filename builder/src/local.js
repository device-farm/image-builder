module.exports = async ({ builder }) => {


    return {
        name: "local <installer-image> <layers...>",
        description: "builds single MIC Linux installer and save image locally",
        define(program) {
            program
                .option("-B, --build-dir <dir>", `directory for docker build context; defaults to ${builder.DEFAULT_BUILD_DIR}`)
                .option("-S, --stop-at <place>", `where to stop: ${[...builder.FRAGMENTS, "build"].join(", ")}`)
        },

        async run(installerImage, layers, {
            buildDir,
            stopAt
        }) {

            await builder.run({
                installerImage,
                layers,
                buildDir,
                stopAt
            });

        }
    }
}