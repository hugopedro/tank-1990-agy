# 🌐 Guia Completo: Como Jogar Online com Amigos à Distância

Este documento explica detalhadamente como jogar o **Tank 1990** de forma síncrona com amigos que estejam em outras casas, outras cidades ou outros estados, sem problemas de rede e sem lag.

---

## ❓ Por que o link `localhost` não funciona para o seu amigo?

A palavra **`localhost`** (ou IP `127.0.0.1`) é uma convenção padrão da computação que significa literalmente **"este meu próprio computador local"**. 

Se você passar um link como `http://localhost:8080/?room=TK5902` para o seu amigo em outro estado:
- O navegador dele vai tentar acessar a porta 8080 **no computador dele mesmo**;
- Como ele não está rodando o servidor no PC dele, o navegador exibirá o erro *"Não é possível acessar esse site"*.

Para que ele consiga abrir o jogo no navegador dele e se conectar à sua sala, existem **3 formas simples e práticas**:

---

## 🌟 Forma 1: GitHub Pages (Recomendada - Link Público Permanente e Grátis)

Como o *Tank 1990* foi construído em **HTML5, CSS e JavaScript estático puro**, ele não precisa de servidor de backend rodando. A conexão em tempo real entre os dois computadores é feita diretamente entre os navegadores via **WebRTC P2P**.

Por isso, você pode hospedar o jogo **100% de graça e para sempre** no GitHub Pages!

### Como ativar o GitHub Pages no seu repositório (2 cliques):

1. Acesse as configurações de páginas do seu repositório no GitHub:
   👉 [https://github.com/hugopedro/tank-1990-agy/settings/pages](https://github.com/hugopedro/tank-1990-agy/settings/pages)

2. Na seção **Build and deployment**:
   - Em **Source**, selecione: `Deploy from a branch`
   - Em **Branch**, selecione: `main` e pasta `/(root)`

3. Clique no botão **Save**.

4. Em cerca de 1 a 2 minutos, o GitHub publicará seu jogo na URL mundial:
   👉 **`https://hugopedro.github.io/tank-1990-agy/`**

### Como vocês vão jogar na prática:

1. **Você (Host / Jogador 1):**
   - Abre o jogo pelo link: `https://hugopedro.github.io/tank-1990-agy/`
   - Na tela inicial, selecione **`🌐 MULTIPLAYER ONLINE`** e clique em **`[1] CRIAR SALA (HOST)`**.
   - O jogo criará a sala (ex: `TK5902`) e **já copia o link completo automaticamente** para a sua área de transferência:
     `https://hugopedro.github.io/tank-1990-agy/?room=TK5902`
   - Cole o link no WhatsApp, Telegram ou Discord do seu amigo.

2. **Seu Amigo (Cliente / Jogador 2):**
   - Dá **um clique** no link recebido no computador dele.
   - O navegador dele abre o jogo e entra na sua sala automaticamente em menos de 2 segundos.
   - A fase inicia para os dois jogarem cooperativamente!

---

## ⚡ Forma 2: Túnel Temporário no seu PC (Para testar em 10 segundos sem configurar nada)

Se você quiser jogar agora mesmo com ele sem esperar a publicação do GitHub Pages, pode abrir uma "ponte pública segura" para o servidor do seu PC usando o **Localtunnel** ou o **ngrok** (ambos já instalados no seu sistema).

### Passo a passo:

1. **Terminal 1:** Inicie o servidor local do jogo:
   ```bash
   cd /home/Hugo/tank1990
   python3 -m http.server 8080
   ```

2. **Terminal 2:** Inicie o túnel público:
   ```bash
   npx localtunnel --port 8080
   ```
   *O terminal informará um link público seguro HTTPS, por exemplo:*
   `your url is: https://bright-tanks-play.loca.lt`

3. **Iniciando a partida:**
   - Abra esse link do túnel no seu navegador (`https://bright-tanks-play.loca.lt`).
   - Crie a sala em `🌐 MULTIPLAYER ONLINE`.
   - O jogo detecta o domínio do túnel e copia para o seu clipboard:
     `https://bright-tanks-play.loca.lt/?room=TK5902`
   - Envie esse link para o seu amigo.

---

## 💡 Forma 3: Ambos com os arquivos no PC usando apenas o Código da Sala

Se o seu amigo também tiver os arquivos do jogo no PC dele e os dois abrirem localmente (`localhost:8080` no PC dele e `localhost:8080` no seu PC), vocês também conseguem jogar juntos!

### Por que isso funciona?
Os arquivos do jogo (HTML, imagens, sons) servem apenas para rodar a interface e a simulação local. A **comunicação de rede entre vocês não passa pelo localhost**: ela é negociada na nuvem pública de sinalização WebRTC através dos servidores STUN mundiais do Google (`stun.l.google.com:19302`).

### Passo a passo:
1. Você clica em **`[1] CRIAR SALA`** no seu PC e vê o código de 4 dígitos na tela (ex: **`TK7412`**).
2. Você envia apenas o código **`7412`** (ou `TK7412`) para o seu amigo.
3. No PC dele, ele entra em `🌐 MULTIPLAYER ONLINE`, clica em **`[2] ENTRAR EM SALA`**, digita **`7412`** e dá Enter.
4. Os dois computadores se conectam diretamente via WebRTC P2P e a partida inicia.

---

## ⚡ Como a Tecnologia Sem Lag Funciona (Arquitetura Técnica)

1. **WebRTC DataChannel (SCTP sobre UDP):**
   - Ao contrário de jogos de navegador antigos que usavam WebSockets (TCP lento com congestionamento), o WebRTC conecta os dois computadores diretamente via **UDP**.
   - No Brasil, a latência direta entre provedores (ex: Vivo, Claro, provedores regionais) fica tipicamente entre **15ms e 35ms**, eliminando qualquer atraso de rede perceptível.

2. **Host-Authoritative com Predição de Entrada no Cliente (Client-Side Prediction):**
   - **Jogador 1 (Host / Tanque Dourado):** Simula a física autoritativa, os tanques inimigos, o comportamento da inteligência artificial, as colisões de balas e a destruição de tijolos/aço/itens.
   - **Jogador 2 (Cliente / Tanque Verde):** Possui predição local a 60 FPS. Quando ele aperta uma tecla ou move o analógico do controle, seu tanque se move **imediatamente com 0ms de atraso visual**. As posições são reconciliadas suavemente em segundo plano com os snapshots enviados pelo Host a cada 16 milissegundos.

3. **Monitor de Ping em Tempo Real:**
   - Durante toda a partida, um crachá no canto superior direito da tela exibe a latência em tempo real:
     - 🟢 **`● P2P: 18ms (HOST)`** / **`● P2P: 18ms (CLIENT)`**: Excelente (abaixo de 50ms).
     - 🟡 **50ms a 100ms**: Jogabilidade perfeitamente fluida.
     - 🔴 **Acima de 100ms**: Alerta de instabilidade na rota do provedor.
