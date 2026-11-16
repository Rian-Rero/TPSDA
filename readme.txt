==============================================================================
 TRABALHO PRÁTICO FINAL - SISTEMAS DISTRIBUÍDOS PARA AUTOMAÇÃO (SDA) - UFMG
 Integração de Sistemas Industriais utilizando OPC UA, Node-RED e MQTT
==============================================================================

Dupla .......: Lara Strutz Carvalho      - matrícula 2023039325
               Rian Rero Lopes Jericó Vieira - matrícula 2023039473
Vídeo .......: [LINK DO VÍDEO]
Processo ....: Tanque de armazenamento com bomba de transferência
               (Tanque01 + Bomba01)

Arquitetura:

  Prosys OPC UA Simulation Server  --OPC UA-->  Node-RED  --MQTT-->  Mosquitto
       (variáveis do processo)                (lógica +              (broker)
                                               dashboard)               |
                                                                        v
                                                              cliente MQTT
                                                              (mosquitto_sub)

------------------------------------------------------------------------------
 1. CONTEÚDO DO PACOTE
------------------------------------------------------------------------------

  readme.txt                     este arquivo
  relatorio.pdf                  relatório do trabalho
  project.uasim                  projeto do Prosys com o Address Space pronto
  docker-compose.yml             sobe o broker Mosquitto em um contêiner
  mosquitto/config/mosquitto.conf  configuração do broker
  nodered/flows.json             fluxos do Node-RED (exportados em JSON)
  nodered/settings.js            configuração do Node-RED usada no trabalho
  nodered/package.json           versões do Node-RED e dos nodes adicionais

Versões utilizadas nos testes:
  - Node.js 26.5.0 (o Node-RED 5 exige Node.js 22.9 ou superior)
  - Node-RED 5.0.9
  - node-red-contrib-opcua 0.2.355 (cliente OPC UA)
  - @flowfuse/node-red-dashboard 1.37.0 (Dashboard 2.0)
  - Eclipse Mosquitto 2 (imagem Docker eclipse-mosquitto:2)
  - Prosys OPC UA Simulation Server 2026.2.2 (Free Edition)
  - Sistema operacional: Linux (Pop!_OS 24.04). Os passos também valem para
    Windows e macOS; as diferenças estão indicadas.

------------------------------------------------------------------------------
 2. PROSYS OPC UA SIMULATION SERVER
------------------------------------------------------------------------------

2.1 Instalação
  - Baixe em https://www.prosysopc.com/products/opc-ua-simulation-server/
    (é preciso preencher o cadastro; o link chega por e-mail).
  - Instale com o instalador do seu sistema operacional e abra o programa.

2.2 Abrir o projeto do trabalho (recomendado)
  - No Prosys: menu File, abra o projeto (arquivo project.uasim deste
    pacote). O Address Space abaixo já vem pronto,
    com as simulações configuradas.

2.3 Endpoint
  - Na aba "Status" o Prosys mostra o endereço de conexão, no formato
        opc.tcp://<nome-do-computador>:53530/OPCUA/SimulationServer
  - O Node-RED usa  opc.tcp://localhost:53530/OPCUA/SimulationServer
  - Na configuração padrão o Prosys já oferece o endpoint sem segurança
    (modo None) com acesso anônimo, que é o usado pelo Node-RED.

2.4 Address Space (aba "Objects") - caso queira criar à mão
  Dentro da pasta Objects, crie o objeto "Processo" e, dentro dele, as
  pastas e variáveis abaixo, nesta ordem:

  Objects
  └── Processo                     (Object)
      ├── Tanque01                 (Folder)
      │   ├── Nivel                Float    Leitura          NodeId ns=3;i=1010
      │   ├── Temperatura          Float    Leitura          NodeId ns=3;i=1011
      │   └── LimiteNivelAlto      Int32    Leitura/Escrita  NodeId ns=3;i=1012
      └── Bomba01                  (Folder)
          ├── Ligada               Boolean  Leitura/Escrita  NodeId ns=3;i=1014
          └── Vazao                Float    Leitura          NodeId ns=3;i=1015

  Valores/simulação (selecione a variável e use a aba "Value": campo
  "Value Type" e parâmetros em "Value Parameters"):
    Nivel ............ sinal senoidal entre 40 e 80 %  (período de ~120 s)
    Temperatura ...... sinal aleatório entre 28 e 34 °C
    Vazao ............ sinal aleatório entre 12 e 16 L/min
    Ligada ........... valor inicial true (comandado pelo dashboard)
    LimiteNivelAlto .. valor inicial 90 (ajustado pelo dashboard)

  IMPORTANTE - NodeIds: os NodeIds acima são os configurados no fluxo e
  são os que o Prosys gerou ao criar os nós nessa ordem (ns=3 é o
  namespace http://www.prosysopc.com/OPCUA/SimulationNodes/). Ao abrir o
  project.uasim eles são mantidos. Se você criar à mão e os NodeIds
  ficarem diferentes (clique na variável para ver o NodeId), não é
  preciso mudar o Prosys: no Node-RED, abra a aba
  "1 - Aquisição OPC UA e Lógica", edite o nó "Configuração dos NodeIds",
  troque os NodeIds e clique em Deploy. Esse é o único lugar do fluxo
  onde os NodeIds aparecem.

------------------------------------------------------------------------------
 3. BROKER MQTT (ECLIPSE MOSQUITTO)
------------------------------------------------------------------------------

Opção A - Docker (usada no trabalho). Na pasta raiz do pacote:

    docker compose up -d
    docker logs mosquitto-sda          (deve mostrar "Opening ipv4 listen socket on port 1883")

  Para parar:  docker compose down

Opção B - Mosquitto instalado no sistema:
  - Linux (Debian/Ubuntu):  sudo apt install mosquitto mosquitto-clients
  - Windows/macOS: instalador em https://mosquitto.org/download/
  Rode, na pasta raiz do pacote (se já houver um Mosquitto rodando como
  serviço na porta 1883, pare o serviço antes):

    mosquitto -c mosquitto/config/mosquitto.conf -v

  O arquivo de configuração abre a porta 1883 e aceita clientes sem senha
  (uso local, didático).

------------------------------------------------------------------------------
 4. NODE-RED
------------------------------------------------------------------------------

  1) Instale o Node.js 22 ou superior (https://nodejs.org).
  2) Na pasta "nodered" do pacote:

        npm install          (instala Node-RED e os nodes de OPC UA e dashboard)
        npm start            (inicia o Node-RED com os fluxos do trabalho)

  3) Editor de fluxos ...: http://localhost:1880
     Dashboard .........: http://localhost:1880/dashboard

  Os fluxos são carregados automaticamente de nodered/flows.json.
  Alternativa: em um Node-RED já instalado, instale pelo menu
  "Manage palette" os pacotes node-red-contrib-opcua e
  @flowfuse/node-red-dashboard e importe o flows.json (Menu > Import).

  Organização dos fluxos (abas):
    1 - Aquisição OPC UA e Lógica    leitura cíclica (1 s) das 5 variáveis,
                                     agrupamento e lógica de alarmes
    2 - Publicação MQTT              publicação das medições, do status e
                                     dos alarmes no broker
    3 - Dashboard e Comandos         dashboard e escrita no servidor OPC UA
                                     (liga/desliga bomba e limite de nível)
    4 - Assinante MQTT (verificação) o próprio Node-RED assinando os tópicos

------------------------------------------------------------------------------
 5. CLIENTE MQTT ADICIONAL
------------------------------------------------------------------------------

Com o Mosquitto em Docker:

    docker exec -it mosquitto-sda mosquitto_sub -h localhost -t "fabrica/#" -v

Com o Mosquitto instalado no sistema:

    mosquitto_sub -h localhost -t "fabrica/#" -v

Somente os alarmes:

    mosquitto_sub -h localhost -t "fabrica/linha01/alarmes" -v

(Qualquer outro cliente MQTT, como o MQTT Explorer, também funciona:
 host localhost, porta 1883, sem usuário e senha.)

Tópicos publicados:
  fabrica/linha01/tanque01/nivel         número (%)        QoS 0
  fabrica/linha01/tanque01/temperatura   número (°C)       QoS 0
  fabrica/linha01/bomba01/vazao          número (L/min)    QoS 0
  fabrica/linha01/bomba01/estado         LIGADA/DESLIGADA  QoS 1, retain
  fabrica/linha01/status                 JSON consolidado  QoS 1, retain
  fabrica/linha01/alarmes                JSON (na mudança) QoS 1, retain
  fabrica/linha01/nodered/conexao        online/offline    QoS 1, retain (LWT)

------------------------------------------------------------------------------
 6. ORDEM DE EXECUÇÃO
------------------------------------------------------------------------------

  1) Abrir o Prosys OPC UA Simulation Server com o project.uasim.
  2) Subir o Mosquitto (docker compose up -d).
  3) Iniciar o Node-RED (cd nodered && npm start).
  4) Abrir o dashboard: http://localhost:1880/dashboard
  5) Abrir o cliente MQTT (mosquitto_sub ... -t "fabrica/#" -v).

------------------------------------------------------------------------------
 7. COMO PROVOCAR AS CONDIÇÕES ANORMAIS
------------------------------------------------------------------------------

  a) Falha de bombeamento (principal): com a bomba LIGADA, no Prosys
     (aba Objects) selecione Processo > Bomba01 > Vazao e, na aba "Value",
     mude Min Value = 12 / Max Value = 16 para Min Value = 1 / Max Value = 3. Após 3 s o estado da planta vai para FALHA, aparece o aviso
     no dashboard e é publicada uma mensagem em fabrica/linha01/alarmes.
  b) Temperatura alta: da mesma forma, mude a simulação de
     Tanque01/Temperatura para valores acima de 40 °C (ex.: 45 a 50).
  c) Nível alto: no dashboard, reduza o "Limite de nível alto" para um valor
     abaixo do nível atual (o valor é escrito no servidor OPC UA).
  d) Falha de comunicação: feche o Prosys. Após 5 s sem leituras o estado
     vai para SEM COMUNICAÇÃO. Ao reabrir o Prosys, a leitura volta sozinha.

  Para voltar ao normal, restaure os valores/simulações originais.

------------------------------------------------------------------------------
 8. PROBLEMAS COMUNS
------------------------------------------------------------------------------

  - Nó "Leitura OPC UA" sem conexão: confira se o Prosys está aberto, se o
    modo de segurança "None" está habilitado e se a porta é 53530.
  - Dashboard com "leitura incompleta" no nó "Lógica do processo": algum
    NodeId não existe no servidor; confira o nó "Configuração dos NodeIds".
  - Nó MQTT "disconnected": o broker não está rodando na porta 1883.
  - Porta 1880 ocupada: outro Node-RED já está rodando.
