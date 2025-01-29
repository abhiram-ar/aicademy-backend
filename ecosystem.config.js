module.exports = {
    apps: [
        {
            name: "aicademy-backend",

            script: "server.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",

            exec_mode: "cluster",
            instances: 1,
            env_production: {
                NODE_ENV: "production",
            },
        },
        {
            name: "Worker",

            script: "./services/AI_Preprocessing_service/handleTranscriptAndEmbedding.consumer.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",

            exec_mode: "cluster",
            instances: 1,
            env_production: {
                NODE_ENV: "production",
            },
        },
    ],

    // other PM2 configuration options
};
