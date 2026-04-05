# 🏋️ Eu Meu Personal Training

Aplicativo mobile para gerenciamento de treinos de musculação no formato ABCD.

## 📱 Sobre o App

O "Eu Meu Personal Training" é um aplicativo leve e simples que permite:

- ✅ Visualizar 4 treinos organizados (A, B, C, D)
- ✅ Cadastrar e editar exercícios com detalhes completos
- ✅ Gerenciar aquecimentos e alongamentos
- ✅ Acompanhar séries, repetições, carga e tempo de descanso
- ✅ Reordenar exercícios dentro do treino
- ✅ Dados salvos localmente no dispositivo

## 🚀 Instalação

### Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) (vem com o Node.js)

### Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

### Passo 2: Iniciar o Aplicativo

Para iniciar o servidor de desenvolvimento:

```bash
npm start
```

Isso abrirá o Expo Dev Tools no seu navegador.

## 📱 Executando no Celular

### Opção 1: Usando o Expo Go (Recomendado para Teste)

1. Instale o app **Expo Go** no seu celular:
   - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Execute `npm start` no terminal

3. Escaneie o QR Code que aparece:
   - **Android**: Use o app Expo Go para escanear
   - **iOS**: Use a câmera nativa do iPhone

4. O app será carregado no seu celular

### Opção 2: Emulador Android

```bash
npm run android
```

Requer Android Studio e emulador configurado.

### Opção 3: Simulador iOS (apenas Mac)

```bash
npm run ios
```

Requer Xcode instalado.

### Opção 4: Versão Web (Recomendado para Desenvolvimento)

Execute o app no navegador do computador:

```bash
npm run web
```

O app abrirá automaticamente em `http://localhost:8081`. Você também pode acessar pelo navegador do celular usando o IP do computador (ex: `http://192.168.1.100:8081`).

### Opção 5: Build de Desenvolvimento (APK para Android)

Se o Expo Go apresentar erros de compatibilidade, você pode criar um build de desenvolvimento que roda diretamente no celular sem depender do Expo Go.

#### Pré-requisitos para Build Android

1. **Android Studio** instalado com:
   - Android SDK
   - Android SDK Platform-Tools
   - Android Emulator (opcional)

2. **Java Development Kit (JDK)** versão 17 ou superior

3. **Variáveis de ambiente** configuradas:
   - `ANDROID_HOME` apontando para o SDK do Android
   - `JAVA_HOME` apontando para o JDK

#### Passo a Passo para Build Android

1. **Instale o expo-dev-client**:
   ```bash
   npx expo install expo-dev-client
   ```

2. **Gere os arquivos nativos do Android**:
   ```bash
   npx expo prebuild --platform android
   ```
   Isso criará a pasta `android/` com o projeto nativo.

3. **Conecte seu celular Android via USB**:
   - Ative o "Modo Desenvolvedor" no celular
   - Ative a "Depuração USB"
   - Conecte o cabo USB
   - Aceite a permissão de depuração no celular

4. **Execute o build no celular**:
   ```bash
   npx expo run:android
   ```
   O app será compilado e instalado diretamente no celular.

5. **Para gerar um APK instalável**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   O APK estará em `android/app/build/outputs/apk/release/app-release.apk`

#### Verificar Dispositivo Conectado

Para verificar se o celular está conectado corretamente:

```bash
adb devices
```

Deve mostrar algo como:
```
List of devices attached
XXXXXXXX    device
```

#### Solução de Problemas do Build

**Erro: "SDK location not found"**
- Crie um arquivo `android/local.properties` com:
  ```
  sdk.dir=C:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
  ```

**Erro: "JAVA_HOME is not set"**
- Configure a variável de ambiente JAVA_HOME apontando para o JDK

**Erro: "No connected devices"**
- Verifique se a depuração USB está ativada
- Tente outro cabo USB
- Execute `adb kill-server` e depois `adb start-server`

## 📖 Como Usar o App

### Tela Inicial

Ao abrir o app, você verá 4 cards representando os treinos:

- **Treino A**: Peito + Ombros (ant. e lat.)
- **Treino B**: Pernas + Glúteos
- **Treino C**: Costas + Lombar + Abdômen
- **Treino D**: Bíceps + Tríceps + Glúteos

Toque em qualquer treino para ver os detalhes.

### Visualizar Treino

Cada treino é dividido em 3 seções:

1. **Aquecimento** (topo)
   - Atividades preparatórias antes do treino
   - Duração em minutos

2. **Exercícios** (meio)
   - Lista de exercícios com:
     - Nome do exercício
     - Séries x Repetições
     - Tempo de descanso
     - Carga (kg)
   - Botões para editar, excluir e reordenar

3. **Alongamentos** (final)
   - Exercícios de flexibilidade pós-treino
   - Músculos alvo

### Adicionar Exercício

1. Na tela do treino, toque no botão **"+"** (canto inferior direito)
2. Preencha os campos:
   - Nome do exercício (obrigatório)
   - Séries (ex: 4)
   - Repetições (ex: 10 ou 8-12)
   - Tempo de descanso em segundos (ex: 90)
   - Carga em kg (ex: 30)
   - Observações (opcional)
3. Toque em **"Salvar"**

### Editar Exercício

1. Toque no botão de editar (✏️) no card do exercício
2. Modifique os campos desejados
3. Toque em **"Salvar"**

### Excluir Exercício

1. Toque no botão de excluir (🗑️) no card do exercício
2. Confirme a exclusão

### Reordenar Exercícios

Use os botões de seta (↑ ↓) para mover exercícios para cima ou para baixo na lista.

### Gerenciar Aquecimentos

1. Na seção de aquecimento, toque em **"Adicionar Aquecimento"**
2. Preencha:
   - Nome da atividade
   - Duração em segundos
   - Link de execução (opcional)
3. Salve ou edite conforme necessário

### Gerenciar Alongamentos

1. Na seção de alongamentos, toque em **"Adicionar Alongamento"**
2. Preencha:
   - Nome do alongamento
   - Duração em segundos
   - Músculos alvo
   - Link de execução (opcional)
3. Salve ou edite conforme necessário

## 💾 Armazenamento de Dados

Todos os dados são salvos automaticamente no dispositivo usando AsyncStorage. Suas informações permanecem mesmo após fechar o app.

## 🧪 Executar Testes

Para executar os testes automatizados:

```bash
npm test
```

Para executar com cobertura:

```bash
npm run test:coverage
```

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Linguagem tipada
- **React Navigation** - Navegação entre telas
- **AsyncStorage** - Persistência local
- **Jest** - Testes unitários
- **fast-check** - Testes baseados em propriedades

## 📂 Estrutura do Projeto

```
eu-meu-personal-training-mobile/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas do app
│   ├── context/         # Gerenciamento de estado global
│   ├── hooks/           # Hooks customizados
│   ├── utils/           # Funções utilitárias
│   ├── types/           # Definições TypeScript
│   ├── constants/       # Constantes e dados padrão
│   └── navigation/      # Configuração de navegação
├── __tests__/           # Testes automatizados
├── App.tsx              # Componente principal
└── package.json         # Dependências do projeto
```

## ❓ Solução de Problemas

### Erro ERESOLVE ao instalar dependências

Se você receber um erro `ERESOLVE could not resolve` ao executar `npm install`, o `package.json` já está configurado corretamente com `react-test-renderer@19.1.0`. Apenas execute:

```bash
npm install
```

Se o problema persistir, tente:

```bash
npm install --legacy-peer-deps
```

### O app não inicia

1. Certifique-se de que o Node.js está instalado: `node --version`
2. Limpe o cache: `npm start -- --clear`
3. Reinstale as dependências:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Erro ao escanear QR Code

**Erro: "Failed to download remote update"**

Este erro ocorre quando o Expo Go não consegue se conectar ao servidor de desenvolvimento. Soluções:

1. **Certifique-se de que ambos estão na mesma rede Wi-Fi**
   - Celular e computador devem estar na mesma rede
   - Evite redes corporativas ou de universidades (podem bloquear portas)

2. **Use o modo Tunnel** (mais lento, mas mais confiável):
   ```bash
   npm start -- --tunnel
   ```
   Aguarde o QR Code aparecer e escaneie novamente.

3. **Use o modo LAN explicitamente**:
   ```bash
   npm start -- --lan
   ```

4. **Limpe o cache do Expo**:
   ```bash
   npm start -- --clear
   ```

5. **Verifique o firewall do Windows**:
   - Permita o Node.js nas configurações do firewall
   - Ou temporariamente desative o firewall para testar

6. **Conecte manualmente** (se o QR Code não funcionar):
   - No Expo Go, toque em "Enter URL manually"
   - Digite o endereço que aparece no terminal (ex: `exp://192.168.x.x:8081`)

7. **Reinicie tudo**:
   ```bash
   # Pare o servidor (Ctrl+C)
   # Feche o Expo Go no celular
   # Execute novamente:
   npm start
   ```

### App fica carregando infinitamente (tela branca)

Este problema pode ter várias causas. Siga estas etapas:

1. **Verifique os logs no terminal**:
   - Olhe o terminal onde você executou `npm start`
   - Procure por erros em vermelho
   - Compartilhe os erros se precisar de ajuda

2. **Limpe o cache completamente**:
   ```bash
   # Pare o servidor (Ctrl+C)
   npm start -- --clear
   ```

3. **Reinicie o Expo Go**:
   - Feche completamente o app Expo Go no celular
   - Abra novamente e tente conectar

4. **Verifique a versão do Expo Go**:
   - Atualize o Expo Go para a versão mais recente na loja de apps
   - Versões antigas podem ter incompatibilidades

5. **Teste em modo de desenvolvimento**:
   - No terminal, pressione `d` para abrir o menu de desenvolvimento
   - Ou sacuda o celular para abrir o menu no Expo Go
   - Selecione "Reload" para recarregar o app

6. **Verifique se há erros de JavaScript**:
   - Sacuda o celular para abrir o menu
   - Toque em "Debug Remote JS"
   - Abra o Chrome DevTools (F12) e veja o console

### Dados não estão salvando

1. Verifique se o app tem permissões de armazenamento
2. Tente limpar os dados do app e reiniciar

## 🌐 Hospedagem Web (Acesso sem Computador Ligado)

Você pode hospedar o app gratuitamente na internet e acessar de qualquer lugar, a qualquer momento.

### Gerar o Build Web

```bash
npx expo export --platform web
```

Isso cria a pasta `dist/` com todos os arquivos necessários.

### Opção 1: Netlify (Mais Fácil)

1. Acesse [netlify.com](https://netlify.com) e crie uma conta gratuita
2. No dashboard, clique em **"Add new site"** → **"Deploy manually"**
3. Arraste a pasta `dist/` para a área de upload
4. Pronto! Você receberá uma URL como `https://seu-app.netlify.app`

### Opção 2: Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita
2. Instale a CLI: `npm install -g vercel`
3. Na pasta do projeto, execute:
   ```bash
   cd dist
   vercel
   ```
4. Siga as instruções e receba sua URL

### Opção 3: GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload do conteúdo da pasta `dist/`
3. Vá em Settings → Pages → Source: Deploy from branch
4. Selecione a branch `main` e salve

### Acessando pelo Celular

Após hospedar, você pode:
- Acessar a URL pelo navegador do celular
- Adicionar à tela inicial (funciona como um app!)
  - **Android**: Menu do Chrome → "Adicionar à tela inicial"
  - **iOS**: Botão compartilhar → "Adicionar à Tela de Início"

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação do [Expo](https://docs.expo.dev/)
2. Consulte a documentação do [React Native](https://reactnative.dev/)
3. Revise os arquivos de especificação em `.kiro/specs/eu-meu-personal-training/`

## 📝 Licença

Este projeto é privado e destinado para uso pessoal.

---

Desenvolvido com ❤️ para facilitar seus treinos de musculação!
