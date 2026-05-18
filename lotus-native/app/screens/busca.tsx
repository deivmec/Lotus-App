import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import BackHeader from '../../components/BackHeader';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const TOPICS = [
  { nav: 'receitas',     icon: 'utensils',   label: 'Receitas',           desc: 'Suas receitas favoritas',         keywords: ['receita','cozinha','comida','prato','ingrediente'] },
  { nav: 'financas',     icon: 'wallet',     label: 'Finanças',           desc: 'Gastos, renda e metas',           keywords: ['financ','dinheiro','gasto','despesa','renda','orcamento','orçamento','conta','poupança','poupanca'] },
  { nav: 'saude',        icon: 'heart',      label: 'Saúde & Bem-estar',  desc: 'Humor, ciclo, remédios, treinos', keywords: ['saude','saúde','bem estar','bemestar','remedio','remédio','treino','ciclo','menstrua','humor','vitamina','medicamento'] },
  { nav: 'viagem',       icon: 'plane',      label: 'Viagem',             desc: 'Destinos e bucket list',          keywords: ['viagem','destino','mochilão','mochilao','turismo','passagem','viajar','férias','ferias'] },
  { nav: 'calendario',   icon: 'calendar',   label: 'Calendário',         desc: 'Eventos e agenda',                keywords: ['calendario','calendário','agenda','evento','compromisso','data'] },
  { nav: 'tasks',        icon: 'tasks',      label: 'Tarefas & Hábitos',  desc: 'Pendências e rotina',             keywords: ['tarefa','habito','hábito','pendencia','pendência','rotina','checklist'] },
  { nav: 'pessoal',      icon: 'person',     label: 'Pessoal',            desc: 'Diário e notas',                  keywords: ['pessoal','diario','diário','nota','anotacao','anotação','caderno'] },
  { nav: 'compras',      icon: 'cart',       label: 'Compras',            desc: 'Lista e recorrentes',             keywords: ['compra','mercado','lista','supermercado','recorrente','wishlist'] },
  { nav: 'inspiracao',   icon: 'palette',    label: 'Inspiração',         desc: 'Moodboard, quadros e paletas',    keywords: ['inspiracao','inspiração','moodboard','quadro','paleta','cores'] },
  { nav: 'inspiracao',   icon: 'portfolio',  label: 'Portfólio',          desc: 'Projetos e trabalhos',            keywords: ['portfolio','portfólio','projeto','trabalho','profissional'] },
  { nav: 'cofre',        icon: 'lock',       label: 'Cofre',              desc: 'Senhas e documentos',             keywords: ['cofre','senha','documento','login','segredo','privado'] },
  { nav: 'conteudo',     icon: 'book',       label: 'Conteúdo',           desc: 'Livros, filmes, cursos',          keywords: ['conteudo','conteúdo','livro','filme','serie','série','podcast','curso'] },
  { nav: 'utilitarios',  icon: 'calculator', label: 'Utilitários',        desc: 'Calculadora, moedas e contagens', keywords: ['utilitario','utilitário','calculadora','moeda','cambio','câmbio','contagem','regressiva'] },
  { nav: 'idiomas',      icon: 'globe',      label: 'Idiomas',            desc: 'Vocabulário e flashcards',        keywords: ['idioma','lingua','língua','vocabulario','vocabulário','flashcard','ingles','inglês'] },
  { nav: 'links',        icon: 'link',       label: 'Links Rápidos',      desc: 'Favoritos organizados',           keywords: ['link','favorito','atalho','url','site','pagina','página'] },
  { nav: 'capilar',      icon: 'leaf',       label: 'Cronograma Capilar', desc: 'Cuidados com o cabelo',           keywords: ['capilar','cabelo','cronograma','hidratacao','hidratação'] },
  { nav: 'notificacoes', icon: 'bell',       label: 'Notificações',       desc: 'Avisos e lembretes',              keywords: ['notificacao','notificação','aviso','lembrete','alerta'] },
] as const;

const DATA_SECTIONS = [
  { key: 'viagem:destinos',        nav: 'viagem',      icon: 'plane',      label: 'Viagem',    getItems: (items: any[]) => items.map(d => ({ id: d.id, title: `${d.emoji||'✈️'} ${d.name}`, sub: [d.type, d.dateStart].filter(Boolean).join(' · ') })), search: (d: any, q: string) => d.name?.toLowerCase().includes(q) },
  { key: 'portfolio:items',        nav: 'inspiracao',  icon: 'portfolio',  label: 'Portfólio', getItems: (items: any[]) => items.map(p => ({ id: p.id, title: `${p.emoji||'💼'} ${p.name}`, sub: p.status })), search: (p: any, q: string) => p.name?.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q) },
  { key: 'tasks:items',            nav: 'tasks',       icon: 'tasks',      label: 'Tarefas',   getItems: (items: any[]) => items.map(t => ({ id: t.id, title: t.text, sub: t.category || t.date || '' })), search: (t: any, q: string) => t.text?.toLowerCase().includes(q) },
  { key: 'receitas:items',         nav: 'receitas',    icon: 'utensils',   label: 'Receitas',  getItems: (items: any[]) => items.map(r => ({ id: r.id, title: r.nome, sub: r.cat })), search: (r: any, q: string) => r.nome?.toLowerCase().includes(q) || r.cat?.toLowerCase().includes(q) },
  { key: 'conteudo:items',         nav: 'conteudo',    icon: 'book',       label: 'Conteúdo',  getItems: (items: any[]) => items.map(c => ({ id: c.id, title: c.title, sub: [c.type, c.author].filter(Boolean).join(' · ') })), search: (c: any, q: string) => c.title?.toLowerCase().includes(q) || c.author?.toLowerCase().includes(q) },
  { key: 'utilitarios:countdowns', nav: 'utilitarios', icon: 'calculator', label: 'Contagens', getItems: (items: any[]) => items.map(c => ({ id: c.id, title: c.label, sub: c.date })), search: (c: any, q: string) => c.label?.toLowerCase().includes(q) },
];

const TAB_ROUTES: Record<string, string> = { tasks: '/(tabs)/tasks', pessoal: '/(tabs)/pessoal' };
const navTo = (nav: string) => {
  const route = TAB_ROUTES[nav] ?? `/screens/${nav}`;
  router.push(route as any);
};

export default function Busca() {
  const [query, setQuery] = useState('');

  const [v]  = useStorage<any[]>('viagem:destinos', []);
  const [p]  = useStorage<any[]>('portfolio:items', []);
  const [t]  = useStorage<any[]>('tasks:items', []);
  const [r]  = useStorage<any[]>('receitas:items', []);
  const [c]  = useStorage<any[]>('conteudo:items', []);
  const [cd] = useStorage<any[]>('utilitarios:countdowns', []);

  const DATA: Record<string, any[]> = {
    'viagem:destinos': v, 'portfolio:items': p, 'tasks:items': t,
    'receitas:items': r, 'conteudo:items': c, 'utilitarios:countdowns': cd,
  };

  const q = query.toLowerCase().trim();

  const seenNavs = new Set<string>();
  const uniqueTopics = q
    ? TOPICS.filter(topic => topic.label.toLowerCase().includes(q) || topic.keywords.some(k => k.includes(q) || q.includes(k)))
        .filter(topic => {
          const key = topic.nav + topic.label;
          if (seenNavs.has(key)) return false;
          seenNavs.add(key);
          return true;
        })
    : [];

  const dataGroups = q
    ? DATA_SECTIONS.map(sec => {
        const matches = (DATA[sec.key] || []).filter(item => sec.search(item, q));
        if (!matches.length) return null;
        return { ...sec, results: sec.getItems(matches) };
      }).filter(Boolean) as any[]
    : [];

  const totalResults = uniqueTopics.length + dataGroups.reduce((acc, g) => acc + g.results.length, 0);

  return (
    <View style={styles.screen}>
      <BackHeader title="Busca" />

      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={colors.text3} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Receitas, finanças, saúde, viagens..."
          placeholderTextColor={colors.text3}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!q && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Pesquise em tudo</Text>
            <Text style={styles.emptyDesc}>Seções, viagens, notas, receitas, tarefas…</Text>
          </View>
        )}

        {!!q && totalResults === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>😕</Text>
            <Text style={styles.emptyTitle}>Nenhum resultado</Text>
            <Text style={styles.emptyDesc}>Tente outras palavras</Text>
          </View>
        )}

        {!!q && totalResults > 0 && (
          <View style={{ gap: 20 }}>
            <Text style={styles.resultCount}>
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </Text>

            {uniqueTopics.length > 0 && (
              <View>
                <View style={styles.groupHeader}>
                  <Icon name="more" size={13} color={colors.text3} />
                  <Text style={styles.groupLabel}>Seções</Text>
                </View>
                <View style={styles.card}>
                  {uniqueTopics.map((topic, i) => (
                    <TouchableOpacity
                      key={topic.nav + topic.label}
                      onPress={() => navTo(topic.nav)}
                      style={[
                        styles.resultRow,
                        i < uniqueTopics.length - 1 && styles.resultRowBorder,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconBadge}>
                        <Icon name={topic.icon as any} size={16} color={colors.accent} />
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>{topic.label}</Text>
                        <Text style={styles.resultSub}>{topic.desc}</Text>
                      </View>
                      <Icon name="arrow" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {dataGroups.map((group: any) => (
              <View key={group.key}>
                <View style={styles.groupHeader}>
                  <Icon name={group.icon as any} size={13} color={colors.text3} />
                  <Text style={styles.groupLabel}>{group.label}</Text>
                </View>
                <View style={styles.card}>
                  {group.results.map((item: any, i: number) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => navTo(group.nav)}
                      style={[
                        styles.resultRow,
                        i < group.results.length - 1 && styles.resultRowBorder,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                        {item.sub ? <Text style={styles.resultSub} numberOfLines={1}>{item.sub}</Text> : null}
                      </View>
                      <Icon name="arrow" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.screenPad,
    marginBottom: 16,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 13,
  },
  clearBtn: {
    fontSize: 16,
    color: colors.text3,
    paddingHorizontal: 4,
  },
  container: {
    paddingHorizontal: spacing.screenPad,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text3,
  },
  resultCount: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resultRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    color: colors.text,
  },
  resultSub: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text3,
    marginTop: 1,
  },
});
