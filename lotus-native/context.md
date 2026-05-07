# Lotus Native — Contexto de Conversão Web → React Native

> **Leia este arquivo no início de cada sessão Claude antes de escrever qualquer código.**
> Projeto web original: `/Users/mariamartini/Lotus-App/src/`
> Projeto RN em construção: `/Users/mariamartini/Lotus-App/lotus-native/`

---

## 1. O que é o app

**Lotus** — app de produtividade pessoal feminino. Funcionalidades:
- Diário pessoal com editor de texto (com PIN de proteção)
- Rastreamento de hábitos e tarefas
- Finanças (lançamentos, metas de poupança, planejamento)
- Saúde (ciclo menstrual, remédios, treinos, medidas)
- Receitas e cronograma alimentar
- Cofre de documentos/logins/contatos (com PIN de proteção)
- Calendário com adesivos/stickers
- Inspiração (mood board, canvas de desenho, paletas de cor)
- Viagem (bucket list, destinos, documentos)
- Compras (listas, wishlist, recorrentes)
- Idiomas (vocabulário, flashcards)
- Utilitários (contagem regressiva, conversor)
- Links rápidos
- Portfólio
- Cronograma capilar
- Autocuidados (skincare, capilar)
- Perfil com foto, tema dark/light, cor de destaque
- **Supabase auth** (email/senha) + sync na nuvem
- **PIN do Cofre** e **PIN do Diário** (armazenados via useStorage)

---

## 2. Stack tecnológica

### Web (original)
| Recurso | Tecnologia |
|---|---|
| Framework | React 19 + Vite |
| Estilo | CSS puro com variáveis CSS |
| Storage local | idb-keyval (IndexedDB) |
| Cloud sync | Supabase (tabela `user_data`) |
| Auth | Supabase Auth (email/senha) |
| Deploy | Vercel |

### React Native (destino)
| Recurso | Tecnologia |
|---|---|
| Framework | Expo SDK 52 |
| Navegação | Expo Router v4 (file-based) |
| Storage local | AsyncStorage |
| Cloud sync | Supabase (mesma tabela `user_data`) |
| Auth | Supabase Auth (mesmo) |
| Fontes | @expo-google-fonts/dm-sans + instrument-serif |
| Deploy | EAS Build + EAS Submit → App Store |

---

## 3. Estrutura de arquivos RN

```
lotus-native/
  app/
    _layout.tsx              # Root: fontes, gesture handler, StatusBar
    (tabs)/
      _layout.tsx            # Tab bar (Início, Tarefas, Pessoal, Mais)
      index.tsx              # Home
      tasks.tsx              # Tasks + Hábitos
      pessoal.tsx            # Diário
      mais.tsx               # Menu "Mais"
    screens/
      compras.tsx
      financas.tsx
      calendario.tsx
      saude.tsx
      cofre.tsx
      viagem.tsx
      conteudo.tsx
      portfolio.tsx
      inspiracao.tsx
      utilitarios.tsx
      notificacoes.tsx
      receitas.tsx
      idiomas.tsx
      links.tsx
      capilar.tsx
      autocuidados.tsx
      perfil.tsx
      busca.tsx
    login.tsx
  components/
    BottomNav.tsx            # (Expo Router tabs cuida disso — não necessário)
    Modal.tsx                # Bottom sheet nativo
    Icon.tsx                 # SVG icons (react-native-svg)
    BackHeader.tsx
    Checkbox.tsx
    ProgressBar.tsx
    Toast.tsx                # usando react-native Animated
    Tag.tsx
  hooks/
    useStorage.ts            # AsyncStorage + Supabase sync (PRONTO)
    useAuth.ts               # Supabase auth (PRONTO)
  lib/
    theme.ts                 # Tokens de design convertidos (PRONTO)
    supabase.ts              # Cliente Supabase com SecureStore (PRONTO)
  context.md                 # ESTE ARQUIVO
  package.json               # (PRONTO)
  app.json                   # Expo config (PRONTO)
  eas.json                   # EAS build config (PRONTO)
```

---

## 4. Traduções CSS → React Native

### Regras fundamentais
```
div, section, article  →  View
span, p, h1-h6         →  Text  (todo texto PRECISA estar em <Text>)
button                 →  TouchableOpacity ou Pressable
input                  →  TextInput
select                 →  Picker ou custom dropdown
textarea               →  TextInput multiline={true}
img                    →  Image
svg                    →  react-native-svg (Svg, Path, Rect, Circle…)
scroll (overflow-y)    →  ScrollView
FlatList               →  para listas longas (performance)
```

### Propriedades CSS que NÃO existem em RN
```
display: flex          →  View já é flex por padrão
position: fixed        →  Modal do RN (não tem fixed)
overflow: hidden       →  overflow: 'hidden' existe mas comportamento diferente
z-index               →  elevation (Android) + zIndex (iOS)
box-shadow            →  shadow* props (iOS) ou elevation (Android)
border-radius         →  borderRadius (sem shorthand top-left etc → use individual)
transition/animation  →  Animated API ou react-native-reanimated
:hover, :focus        →  não existe — use onPressIn/onPressOut
env(safe-area-*)      →  useSafeAreaInsets() do react-native-safe-area-context
100vh / 100dvh        →  Dimensions.get('window').height ou useWindowDimensions()
gap (flex)            →  gap existe no RN 0.71+ ✓
```

### Padrão de estilo correto em RN
```tsx
// ERRADO — não funciona no RN
<View style={{ display: 'flex', flexDirection: 'column' }}>

// CERTO — View já é flex column por padrão
<View style={{ gap: 12 }}>

// ERRADO
<div style={{ color: 'red', fontSize: 14 }}>texto</div>

// CERTO — Text para todo texto
<Text style={{ color: colors.red, fontSize: 14 }}>texto</Text>
```

---

## 5. Tokens de design (usar de lib/theme.ts)

```ts
import { colors, radius, spacing, fonts } from '../lib/theme';

// Cores
colors.bg          // #F7F4F0
colors.bg2         // #EDE9E3
colors.surface     // #FFFFFF
colors.line        // #D8D2CA
colors.text        // #2C2A28
colors.text2       // #7A756E
colors.text3       // #B0A99F
colors.accent      // #B8784A
colors.accentBg    // #F5EDE6
colors.green       // #5A9E6F
colors.blue        // #5A7FAE
colors.red         // #C45C4F

// Radius
radius.sm          // 8
radius.md          // 12
radius.lg          // 18

// Spacing
spacing.screenPad  // 24
spacing.md         // 12

// Fontes (após useFonts no _layout.tsx)
fonts.serif        // 'InstrumentSerif_400Regular'
fonts.sans         // 'DMSans_400Regular'
fonts.sansMedium   // 'DMSans_500Medium'
```

---

## 6. Componentes compartilhados — como converter

### Modal (Bottom Sheet)
Web usa `position: fixed` + CSS. RN usa `Modal` do React Native:
```tsx
import { Modal, View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ver components/Modal.tsx quando for criado
```

### useStorage
**API idêntica ao web** — copiar e colar sem alterações:
```ts
const [value, save, ready] = useStorage('chave', defaultValue);
```

### Toast
Web usa `createPortal`. RN usa `Modal` com `transparent` e `Animated`:
```tsx
// Criar components/Toast.tsx — similar ao web mas com Animated.Value
```

### Input
```tsx
// Web: <input className="input" ... />
// RN:
<TextInput
  style={styles.input}
  placeholder="..."
  placeholderTextColor={colors.text3}
  value={value}
  onChangeText={setValue}
/>

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
});
```

### Button primário
```tsx
<TouchableOpacity style={styles.btnPrimary} onPress={handlePress} activeOpacity={0.85}>
  <Text style={styles.btnPrimaryText}>Adicionar</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  btnPrimary: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.bg,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
});
```

---

## 7. Navegação (Expo Router)

```
app/
  (tabs)/index.tsx    →  Tab "Início"        (Home.jsx)
  (tabs)/tasks.tsx    →  Tab "Tarefas"       (Tasks.jsx)
  (tabs)/pessoal.tsx  →  Tab "Pessoal"       (Pessoal.jsx)
  (tabs)/mais.tsx     →  Tab "Mais"          (Mais.jsx)
  screens/compras.tsx →  Sub-tela empurrada  (Compras.jsx)
  login.tsx           →  Login               (Login.jsx)
```

Para navegar:
```tsx
import { router } from 'expo-router';
router.push('/screens/compras');   // abre sub-tela
router.back();                      // volta (equivalente ao onBack)
```

Para proteção de login (redirecionar se não autenticado):
```tsx
// Em app/_layout.tsx ou cada tela que precisa de auth
import { Redirect } from 'expo-router';
if (!authed) return <Redirect href="/login" />;
```

---

## 8. Status de conversão por tela

### INFRAESTRUTURA (feita)
- [x] `lib/theme.ts` — tokens de design
- [x] `lib/supabase.ts` — cliente com SecureStore
- [x] `hooks/useStorage.ts` — AsyncStorage + sync Supabase
- [x] `hooks/useAuth.ts` — Supabase auth
- [x] `app/_layout.tsx` — root com fontes
- [x] `app/(tabs)/_layout.tsx` — tab bar
- [x] `package.json`, `app.json`, `eas.json`

### COMPONENTES (feitos)
- [x] `components/Icon.tsx` — 74 ícones SVG via react-native-svg
- [x] `components/Modal.tsx` — bottom sheet com KeyboardAvoidingView
- [x] `components/BackHeader.tsx` — cabeçalho com botão voltar + safe area
- [x] `components/Toast.tsx` — ToastProvider + useToast + Animated fade
- [x] `components/Checkbox.tsx`
- [x] `components/ProgressBar.tsx`
- [x] `components/Tag.tsx` — inclui PriorityTag

### TELAS — ordem sugerida (simples → complexo)
| Prioridade | Tela | Linhas web | Complexidade | Status |
|---|---|---|---|---|
| 1 | `login.tsx` | 174 | Baixa | [x] |
| 2 | `screens/mais.tsx` | 73 | Baixa | [x] |
| 3 | `screens/links.tsx` | 110 | Baixa | [x] |
| 4 | `screens/notificacoes.tsx` | 117 | Baixa | [ ] |
| 5 | `screens/conteudo.tsx` | 137 | Baixa | [x] |
| 6 | `screens/portfolio.tsx` | 137 | Baixa | [x] |
| 7 | `screens/capilar.tsx` | 152 | Baixa | [ ] |
| 8 | `screens/autocuidados.tsx` | 292 | Média | [ ] |
| 9 | `screens/utilitarios.tsx` | 350 | Média | [ ] |
| 10 | `screens/calendario.tsx` | 269 | Média | [ ] |
| 11 | `(tabs)/tasks.tsx` | 255 | Média | [ ] |
| 12 | `screens/viagem.tsx` | 411 | Média | [ ] |
| 13 | `screens/cronograma.tsx` | 237 | Média | [ ] |
| 14 | `screens/idiomas.tsx` | 426 | Média | [ ] |
| 15 | `screens/compras.tsx` | 428 | Média | [ ] |
| 16 | `screens/financas.tsx` | 428 | Alta | [ ] |
| 17 | `screens/cofre.tsx` | 384 | Alta | [ ] |
| 18 | `screens/busca.tsx` | 189 | Alta | [ ] |
| 19 | `screens/receitas.tsx` | 608 | Alta | [ ] |
| 20 | `screens/perfil.tsx` | 469 | Alta | [ ] |
| 21 | `(tabs)/mais.tsx` | 73 | Baixa | [ ] |
| 22 | `screens/saude.tsx` | 991 | Muito alta | [ ] |
| 23 | `(tabs)/index.tsx` (Home) | 1154 | Muito alta | [ ] |
| 24 | `(tabs)/pessoal.tsx` (Diário) | 793 | Muito alta | [ ] |
| 25 | `screens/inspiracao.tsx` | 633 | Muito alta | [ ] |

---

## 9. Funcionalidades especiais — como converter

### Canvas de desenho (Inspiração)
```
Web: <canvas> com onPointerDown/Move/Up
RN:  react-native-skia (recomendado) ou react-native-canvas
Pacote: @shopify/react-native-skia
```

### Rich text editor (Diário/Pessoal)
```
Web: contentEditable div + document.execCommand
RN:  NÃO existe contentEditable
     Opções: react-native-rich-editor, ou TextInput multilinha simples
     Recomendado para MVP: TextInput com markdown básico
```

### Câmera / galeria (Cofre, Perfil)
```
Web: <input type="file" accept="image/*">
RN:  expo-image-picker (já no package.json)
     import * as ImagePicker from 'expo-image-picker';
```

### Animações
```
Web: CSS transition/animation
RN:  react-native-reanimated (já no package.json)
     Para fades simples: Animated.timing da RN pura
```

### Temas dark/light
```
Web: data-theme="dark" no HTML + CSS variables
RN:  useColorScheme() do RN + Context com tema atual
     Criar ThemeContext.tsx que provê as cores certas
```

### PIN pad
```
Web: componentes PinPad + PinDots em Pessoal.jsx e Cofre.jsx
RN:  recriar com TouchableOpacity grid 3x4
     Vibração ao errar: Vibration.vibrate() ou expo-haptics
```

---

## 10. Variáveis de ambiente

Criar arquivo `.env` em `lotus-native/`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Atenção:** Em Expo, variáveis públicas usam prefixo `EXPO_PUBLIC_`  
> (diferente do web que usa `VITE_`)

---

## 11. Como rodar / testar

```bash
cd /Users/mariamartini/Lotus-App/lotus-native

# Instalar dependências (só na primeira vez)
npm install

# Iniciar servidor de desenvolvimento
npx expo start

# Testar no iPhone: abrir câmera e escanear QR code
# (Expo Go precisa estar instalado no iPhone)

# Build para TestFlight (sem publicar)
eas build --platform ios --profile preview

# Publicar na App Store
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 12. Instrução para o Claude nas próximas sessões

**Ao iniciar uma nova sessão:**
1. Leia este arquivo (`lotus-native/context.md`)
2. Leia a tela web original em `src/screens/[Nome].jsx`
3. Converta seguindo os padrões da seção 4 e 5
4. Use os hooks prontos (`useStorage`, `useAuth`)
5. Use os tokens de `lib/theme.ts`
6. Marque a tela como `[x]` na tabela da seção 8 ao concluir

**Próxima tela a converter:** `screens/notificacoes.tsx` → `screens/capilar.tsx` → `screens/autocuidados.tsx` (prioridade 4, 7, 8)

**Referências:**
- Notificações web: `src/screens/Notificacoes.jsx`
- Capilar web: `src/screens/Capilar.jsx`
- Autocuidados web: `src/screens/Autocuidados.jsx`

---

## 13. Configurar EAS (uma vez só)

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar o projeto (na primeira vez)
eas build:configure

# Preencher eas.json com seus dados:
# - appleId: seu Apple ID
# - ascAppId: ID do app no App Store Connect
# - appleTeamId: seu Team ID da Apple Developer
```

Para encontrar o `ascAppId`: App Store Connect → Meu App → App Information → Apple ID (número abaixo do nome).
