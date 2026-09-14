# 📖 TANK 1990 - Manual Completo de Comandos, Regras e Itens

Este documento reúne todas as instruções de jogo, atalhos de teclado, mecânicas originais e novidades da edição **Tank 1990**.

---

## 🕹️ Controles do Teclado

### Jogador 1 (Solo ou Cooperativo)
| Ação | Teclas |
| :--- | :--- |
| **Mover para Cima** | `W` ou `Seta para Cima` (em 1P) |
| **Mover para Baixo** | `S` ou `Seta para Baixo` (em 1P) |
| **Mover para Esquerda** | `A` ou `Seta para Esquerda` (em 1P) |
| **Mover para Direita** | `D` ou `Seta para Direita` (em 1P) |
| **Disparar Canhão** | `Barra de Espaço` ou `J` |

### Jogador 2 (Modo 2 Jogadores)
| Ação | Teclas |
| :--- | :--- |
| **Mover** | `Setas do Teclado` (Cima, Baixo, Esquerda, Direita) |
| **Disparar Canhão** | `Enter` ou `NumPad 0` ou `K` |

---

## 🎮 Suporte a Joystick / Controle Xbox 360 (Plug & Play)

O jogo possui suporte nativo à **HTML5 Gamepad API**, reconhecendo automaticamente joysticks **Xbox 360, Xbox One, Series X/S, PS4/PS5 e controles USB/Bluetooth** padrão XInput sem necessidade de configuração adicional.

### 🎮 Mapeamento do Controle (Xbox 360)
| Botão no Joystick | Ação no Jogo |
| :---: | :--- |
| **D-Pad (Direcional Digital)** | Movimentação precisa do tanque em 4 direções |
| **Analógico Esquerdo (Stick)** | Movimentação analógica com zona morta de 28% (anti-drift) |
| **Botão `A` ou `X`** | Disparar canhão / Confirmar seleção |
| **Gatilhos `RT` ou `RB`** | Disparo rápido ergonômico |
| **Botão `Start`** | Iniciar partida / Pausar e despausar |
| **Botão `Back` / `Select`** | Alternar entre modo 1P e 2P / Reiniciar |
| **Botão `Y` ou `LB`** | Alternar em tempo real o estilo visual (`✨ MODERNO 2D` ↔ `🕹️ CLÁSSICO NES`) |

### 👥 2 Jogadores com 2 Controles Independentes
- Conecte 2 controles ao PC:
  - **Controle 1:** Pilota o **Jogador 1** (Tanque Amarelo/Dourado).
  - **Controle 2:** Pilota o **Jogador 2** (Tanque Verde).
- Uma notificação translúcida em neon surge no topo da tela confirmando a detecção de cada controle conectado (`🎮 CONTROLE 1 CONECTADO`).

### 📳 Feedback de Vibração Tátil (Dual-Rumble)
- **Disparos:** Pulso leve e ágil no motor de vibração.
- **Tiro no Aço / Ricochete:** Vibração média de impacto.
- **Explosão de Tanque:** Impacto potente nos motores de baixa e alta frequência.
- **Destruição da Base (Águia):** Tremor longo e contínuo nos dois controles.

---

## ⌨️ Atalhos Rápidos Globais

Como a tela do jogo agora opera em modo **Arcade Imersivo / Tela Cheia**, todos os ajustes rápidos podem ser acionados diretamente pelas teclas:

| Tecla | Função |
| :---: | :--- |
| **`G`** | **Alternar Estilo Visual:** Troca em tempo real entre `✨ MODERNO 2D` e `🕹️ CLÁSSICO NES 8-BIT`. |
| **`M`** | **Mutar / Ativar Áudio:** Liga ou desliga o sintetizador Web Audio API. |
| **`P`** ou **`Enter`** | **Pausar Partida:** Pausa a simulação com letreiro na tela. |
| **`R`** | **Reiniciar:** Volta para a tela inicial de título (Title Screen). |
| **`F`** | **Tela Cheia Real:** Entra ou sai do modo Fullscreen nativo do navegador. |
| **`1`** | Seleciona o modo **1 Jogador**. |
| **`2`** | Seleciona o modo **2 Jogadores**. |
| **`N`** | Avança para a **Próxima Fase** (Stage 1 a 5). |
| **`C`** | Alterna o filtro retrô de **Scanlines CRT** (`ON` / `OFF`). |

---

## 🎯 Objetivo do Jogo
1. **Destrua os 20 tanques inimigos** que invadem o campo de batalha a cada fase.
2. **Proteja a Águia (Base):** Se um projétil inimigo (ou amigo!) atingir o brasão da base, a Águia é destruída e a partida termina imediatamente (**GAME OVER**).
3. **Sobrevivência:** Cada jogador começa com 3 vidas. Colete o tanque bônus ou acumule pontuação para ganhar vidas extras.

---

## 🎁 Power-ups & Itens Especiais

Ao destruir tanques inimigos piscantes (tanques bônus vermelhos/brancos), um item é gerado aleatoriamente no mapa:

| Item | Nome | Efeito |
| :---: | :--- | :--- |
| 🔫 | **Pistola (Hack Tank 1990)** | Concede imediatamente o upgrade máximo (**Super Tank Tier 3**) com tiro ultra-rápido duplo, capacidade de **destruir paredes de aço e cortar árvores**, além de 5 segundos de escudo! |
| 🚤 | **Barco / Lancha (Hack Tank 1990)** | Permite ao tanque **navegar livremente sobre a água** sem ficar preso nas margens. |
| ⭐ | **Estrela** | Upgrade progressivo do canhão:<br>• 1ª Estrela: Tiro rápido.<br>• 2ª Estrela: Dois tiros simultâneos.<br>• 3ª Estrela: Projéteis pesados capazes de romper blocos de aço. |
| ⛏️ | **Pá** | Converte a muralha de tijolos ao redor da Águia em **paredes de aço impenetráveis por 20 segundos** (pisca nos 4s finais). |
| 💣 | **Granada** | Detona instantaneamente todos os tanques inimigos visíveis na tela (+500 pontos cada). |
| ⏰ | **Relógio** | Congela completamente todos os inimigos por 10 segundos. |
| 🛡️ | **Capacete** | Concede um campo de força de invulnerabilidade por 10 segundos. |
| 🚜 | **Tanque (1-UP)** | Concede 1 vida adicional com fanfarra comemorativa. |

> ⚠️ **Atenção (Mecânica do Tank 1990):** No clássico Tank 1990, **tanques inimigos também roubam itens** caso passem por cima deles no cenário! Se um inimigo pegar uma granada, os jogadores explodem; se pegar uma pá, a base do jogador é exposta!

---

## 🤖 Tipos de Tanques Inimigos

1. **Tanque Básico (100 pts):** Tanque cinza padrão, velocidade moderada, destruído com 1 tiro.
2. **Tanque Rápido / Scout (200 pts):** Tanque ágil de alta velocidade, tenta se esquivar e flanquear a base.
3. **Tanque de Potência (300 pts):** Possui canhão veloz de alta cadência de disparo, muito perigoso para as muralhas.
4. **Tanque Blindado / Armored (400 pts):** Requer **4 tiros** para ser derrotado. Sua armadura muda de cor a cada impacto:
   - *Verde* ➔ *Amarelo* ➔ *Prata* ➔ *Vermelho* ➔ *Detonação*.
5. **Tanque Bônus:** Qualquer tanque que surge piscando em tons vermelhos e brancos; ao ser atingido pela primeira vez, faz surgir um item aleatório na arena.

---

## 🧱 Elementos do Cenário
- **Tijolos:** Destruídos por qualquer projétil com precisão sub-bloco de 4x4 pixels.
- **Aço:** Impenetrável para tiros comuns; pode ser perfurado apenas por tanques no nível 3 (ou com a Pistola).
- **Árvores / Folhagem:** Camada elevada que oculta os tanques e projéteis que passam por baixo. Tanques nível 3 podem cortar as árvores com seus disparos.
- **Água:** Barreira intransponível para tiros terrestres e movimentação normal (a menos que o tanque possua o item Barco).
- **Gelo:** Reduz o atrito, provocando deslizamento por inércia ao mudar de direção.

---

## 🌐 Modo Multiplayer Online P2P (Sem Lag)

Para jogar com um amigo que mora em outro estado ou em outra rede sem sofrer com lags de servidores intermediários, o jogo conta com arquitetura **WebRTC Peer-to-Peer nativa (DataChannel SCTP sobre UDP)**.

### ⚡ Como Funciona a Tecnologia Sem Lag
1. **Conexão Direta Ponta a Ponta (P2P):** Os dois computadores trocam dados diretamente sem passar por nenhum servidor central na nuvem, garantindo a menor rota física possível (normalmente 15ms a 35ms de latência entre estados no Brasil).
2. **Host-Authoritative com Predição de Entrada (Client-Side Prediction):**
   - **Jogador 1 (Host):** Simula os tanques inimigos, inteligência artificial, física dos projéteis e destruição do cenário.
   - **Jogador 2 (Cliente):** Move o seu tanque **localmente a 60 FPS com 0ms de atraso perceptível de input**. Os pacotes de sincronização do Host reconciliam suavemente as posições em segundo plano.
3. **Indicador de Latência no HUD:** Um marcador no canto superior direito (`● P2P: 18ms`) monitora continuamente a latência real em milissegundos.

### 🚀 Como Criar e Entrar em uma Sala

#### Se você for o Host (Jogador 1):
1. Na tela de título, selecione `🌐 MULTIPLAYER ONLINE` (usando as setas e Enter, ou o direcional e botão A do joystick, ou clicando com o mouse).
2. Selecione **`[1] CRIAR SALA (HOST)`**.
3. O jogo gerará um código exclusivo (ex: `TK5902`) e **copiará o link direto da sala automaticamente para a sua área de transferência**.
4. Envie o link ou o código de 4 dígitos para o seu amigo via WhatsApp, Telegram ou Discord.
5. Assim que ele se conectar, a tela da sala fecha e a fase inicia cooperativamente para os dois!

#### Se você for o Amigo Convidado (Jogador 2):
- **Opção A (Mais rápida):** Basta abrir o link recebido (ex: `https://seu-site.com/?room=TK5902`). O jogo se conectará à sala automaticamente em menos de 2 segundos!
- **Opção B:** Abra o jogo, vá em `🌐 MULTIPLAYER ONLINE`, escolha **`[2] ENTRAR EM SALA`** e digite o código de 4 dígitos fornecido pelo Host.

