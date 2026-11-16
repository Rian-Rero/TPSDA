// Configuracao do Node-RED para o TP final de SDA
// Iniciar com:  npm start   (dentro da pasta nodered)
module.exports = {
    uiPort: process.env.PORT || 1880,
    flowFile: 'flows.json',
    flowFilePretty: true,
    // Sem credenciais sensiveis no fluxo (broker local sem senha)
    credentialSecret: false,
    logging: {
        console: { level: "info", metrics: false, audit: false }
    },
    editorTheme: {
        projects: { enabled: false },
        tours: false
    },
    functionGlobalContext: {},
    // Nao envia dados de uso ao projeto Node-RED e nao exibe o aviso de atualizacao
    telemetry: { enabled: false }
};
