const { spawn } = require("child_process");

module.exports = async () => {
    return function (command, args, env) {
        return new Promise((resolve, reject) => {

            let proc = spawn(command, args, {
                env: { ...process.env, ...env },
                stdio: ["inherit", "inherit", "inherit"]
            });

            proc.on("exit", (code, signal) => {
                if (signal) {
                    let error = new Error(`Process received ${signal}`);
                    error.signal = signal;
                    reject(error);
                } else if (code) {
                    let error = new Error(`Process exited with code ${code}`);
                    error.code = code;
                    reject(error);
                } else {                    
                    resolve();
                }
            });

            proc.on("error", error => {
                reject(error);
            });
        });
    }
}