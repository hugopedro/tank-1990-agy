# TANK 1990 - Edição Fiel NES em HTML5 Canvas & Web Audio API
## Com Modo Moderno 2D HD (Estilo New Super Mario Bros. U) + Clássico NES 8-Bit

Uma recriação completa do clássico **Battle City / Tank 1990** do NES, desenvolvida em **HTML5 Canvas puro** e **Web Audio API** (sem bibliotecas externas, 100% offline). Agora conta com **Modo Gráfico Híbrido**: o visual retrô autêntico de 8-bits e o novo estilo **Moderno 2D Vetorial** inspirado nos remakes 2D da Nintendo (*New Super Mario Bros. U / Wonder*).

---

## 🎮 Como Jogar

Você pode abrir o jogo de duas formas:

1. **Diretamente no navegador:**
   Abra o arquivo [index.html](file:///home/Hugo/tank1990/index.html) no Firefox, Chrome ou qualquer navegador moderno.

2. **Via Servidor Local:**
   ```bash
   cd /home/Hugo/tank1990
   python3 -m http.server 8080
   ```
   E acesse no navegador: `http://localhost:8080`

---

## 🕹️ Controles e Atalhos de Teclado

> 📖 **Manuais e Guias:**
> - [COMANDOS_E_REGRAS.md](file:///home/Hugo/tank1990/COMANDOS_E_REGRAS.md): Manual completo de regras, itens, joystick Xbox 360 e atalhos.
> - [COMO_JOGAR_ONLINE.md](file:///home/Hugo/tank1990/COMO_JOGAR_ONLINE.md): Guia passo a passo para jogar com amigos à distância (GitHub Pages, túneis e código P2P).

### Atalhos Rápidos Globais (Modo Tela Cheia)
- **`G`:** Alterna em tempo real entre o visual **`✨ MODERNO 2D`** e o **`🕹️ CLÁSSICO NES`**.
- **`F`:** Entra / sai do modo **Tela Cheia Real** (Fullscreen nativo do navegador).
- **`M`:** Liga / desliga o som sintetizado 8-bit.
- **`P`** ou **`Enter`:** Pausa a partida.
- **`R`:** Reinicia para a tela de título.
- **`1` / `2`:** Alterna entre 1 Jogador e 2 Jogadores.
- **`N`:** Pula para a próxima fase.
- **`C`:** Liga / desliga o filtro de linhas de varredura CRT.

### Jogador 1
- **Mover:** Teclas `W`, `A`, `S`, `D` ou as `Setas do Teclado` (no modo 1P)
- **Atirar:** `Barra de Espaço` ou tecla `J`

### Jogador 2 (Modo 2 Jogadores)
- **Mover:** `Setas do Teclado` (`Cima`, `Baixo`, `Esquerda`, `Direita`)
- **Atirar:** `Enter` ou `NumPad 0` / tecla `K`

---

## ⭐ Destaques e Mecânicas do Tank 1990

### 🚀 Exclusividades do Tank 1990 (Hack lendário do NES)
- **🔫 Pistola:** Concede instantaneamente o upgrade máximo (**Super Tank Nível 3**), permitindo romper paredes de aço, cortar árvores/folhagens e escudo protetor!
- **🚤 Barco / Lancha:** Permite que o tanque navegue diretamente sobre a água!
- ⚠️ **Inimigos Roubam Itens:** Fiel ao Tank 1990 original, os tanques inimigos também podem passar por cima dos powerups e ativá-los (ganham escudos, bombas contra o jogador ou viram tanques pesados)!

### 🛡️ Itens Clássicos
- **⭐ Estrela:** Upgrade progressivo do canhão (Nível 1 = tiro veloz; Nível 2 = tiro duplo; Nível 3 = destrói aço).
- **⛏️ Pá:** Transforma a mureta de tijolos que protege a Águia em blocos de aço indestrutíveis por 20 segundos (pisca nos 4 segundos finais antes de expirar).
- **💣 Granada:** Detona imediatamente todos os tanques inimigos ativos na tela (+500 pts cada).
- **⏰ Relógio:** Congela todos os tanques inimigos por 10 segundos.
- **🛡️ Capacete:** Escudo de invulnerabilidade temporária.
- **🚜 Tanque (1-UP):** Concede 1 vida extra com o jingle característico.

### 🤖 Tipos de Tanques Inimigos
1. **Básico (Cinza):** Movimentação padrão, 1 tiro para destruir (100 pts).
2. **Rápido / Scout:** Tanque ligeiro de alta velocidade (200 pts).
3. **Power / Rápido:** Canhão de alta cadência e velocidade de projétil (300 pts).
4. **Armadura Pesada:** Tanque blindado resistente a **4 tiros**, mudando de cor a cada acerto (Verde ➔ Amarelo ➔ Prata ➔ Vermelho ➔ Explosão) (400 pts).
5. **Tanque Bônus (Piscante):** Tanque que pisca em vermelho e branco; ao ser atingido, dropa um item aleatório no campo de batalha!

---

## 🔊 Áudio Sintetizado 8-Bit (Web Audio API)
Sem arquivos de áudio pesados! O sistema sintetiza fielmente em tempo real os 4 canais do chip **NES 2A03**:
- **Pulse Channels (Ondas Quadradas):** Melodia clássica de abertura da fase (Stage Start), disparos, ricochete no aço, dings da pontuação e fanfarra de Game Over.
- **Triangle Channel (Onda Triangular):** Ronco contínuo do motor do tanque (que modula o tom quando em movimento).
- **Pseudo-Random LFSR Noise Channel:** Detonações de tijolos, explosões de tanques e impacto de projéteis.

---

## 🎨 Visual Moderno 2D (Estilo New Super Mario Bros. U)
- **Tanques Estilo "Toy / Clay":** Gradientes esféricos suaves, quinas arredondadas, sombras de contato (ambient occlusion), canhões cilíndricos com recuo e anéis de blindagem.
- **Tijolos em Terracota com Chanfro:** Relevo tridimensional, ranhuras de argamassa e fragmentação dinâmica em pedregulhos com gravidade.
- **Placas de Aço em Titânio Escovado:** Rebites polidos nos cantos e reflexos especulares metálicos.
- **Árvores e Folhagens Vivas:** Copas arredondadas e volumosas com balanço idle orgânico (swaying) e folhas que flutuam ao vento.
- **Água Tropical Animada:** Gradiente turquesa com ondas ondulatórias e cáusticas em tempo real.
- **Base da Águia Dourada:** Pedestal de pedra nobre com brasão dourado e halo pulsante em gradiente radial.
- **Visual Permanente de Alta Definição:** Interface, cenários e efeitos 100% integrados no estilo moderno vibrante.

---

## 📁 Estrutura do Código

- [index.html](file:///home/Hugo/tank1990/index.html): Gabinete arcade, canvas nativo em alta definição (1024x896) e barra de alternância visual.
- [style.css](file:///home/Hugo/tank1990/style.css): Estilização moderna, efeitos de scanlines CRT opcionais e D-pad touch responsivo.
- [js/audio.js](file:///home/Hugo/tank1990/js/audio.js): Sintetizador Web Audio API emulando fielmente o chip de som do NES 2A03.
- [js/sprites.js](file:///home/Hugo/tank1990/js/sprites.js): Renderizador procedural híbrido (gráficos vetoriais HD modernos + sprites 8-bits pixel art autênticos).
- [js/particles.js](file:///home/Hugo/tank1990/js/particles.js): Sistema de partículas (faíscas, estilhaços de tijolos, poeira de esteira, fumaça de tiro e ondas na água).
- [js/maps.js](file:///home/Hugo/tank1990/js/maps.js): Fases clássicas em matriz 26x26 sub-tiles (8x8 px), fortaleza da águia e renderização de camadas de profundidade.
- [js/bullet.js](file:///home/Hugo/tank1990/js/bullet.js): Balística, colisão projétil-contra-projétil, destruição sub-tile e emissão de partículas de impacto.
- [js/tank.js](file:///home/Hugo/tank1990/js/tank.js): Física dos tanques, deslize de quina (corner sliding), inércia no gelo e inteligência artificial de navegação.
- [js/powerup.js](file:///home/Hugo/tank1990/js/powerup.js): Gerenciador dos 8 tipos de powerups com renderização de medalhões de cristal e suporte a roubo por inimigos.
- [js/ui.js](file:///home/Hugo/tank1990/js/ui.js): HUD moderno em glassmorphism neon, cortina de início de fase, tela de pontuação (Stage Clear tally) e Game Over.
- [js/gamepad.js](file:///home/Hugo/tank1990/js/gamepad.js): Suporte plug-and-play para controles Xbox 360 / XInput, detecção automática e vibração haptic dual-rumble.
- [js/multiplayer.js](file:///home/Hugo/tank1990/js/multiplayer.js): Subssistema multiplayer online P2P via WebRTC DataChannels com predição de entrada no cliente, sincronização a 60Hz e lobby.
- [js/peerjs.min.js](file:///home/Hugo/tank1990/js/peerjs.min.js): Biblioteca local de WebRTC P2P signaling para conexão direta ponto a ponto sem servidores intermediários.
- [js/game.js](file:///home/Hugo/tank1990/js/game.js): Loop principal de jogo, câmera trauma / screen shake, fixed timestep e gerenciamento global de estados.
