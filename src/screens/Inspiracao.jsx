import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const TABS = [
  { id: 'moodboard', label: 'Moodboard' },
  { id: 'paletas',   label: 'Paletas' },
];

const normalizeColor = (c) => typeof c === 'string' ? { hex: c, name: '' } : c;

const DEFAULT_PALETTES = [
  { id: 'dp1', name: 'Natureza', colors: [
    { hex: '#4A5240', name: 'Musgo' }, { hex: '#8A9E7A', name: 'Sage' },
    { hex: '#C8D4AD', name: 'Bambu' }, { hex: '#E8DCC8', name: 'Areia' }, { hex: '#A0784A', name: 'Terra' },
  ]},
  { id: 'dp2', name: 'Oceano', colors: [
    { hex: '#0D2137', name: 'Abismo' }, { hex: '#1B5E8A', name: 'Mar' },
    { hex: '#4A90B8', name: 'Ondas' }, { hex: '#A8CCE0', name: 'Espuma' }, { hex: '#D4C4A8', name: 'Areia Molhada' },
  ]},
  { id: 'dp3', name: 'Pôr do Sol', colors: [
    { hex: '#1A1035', name: 'Noite' }, { hex: '#6B3FA0', name: 'Roxo' },
    { hex: '#E8614A', name: 'Coral' }, { hex: '#F5943A', name: 'Laranja' }, { hex: '#F7CC6A', name: 'Dourado' },
  ]},
  { id: 'dp4', name: 'Pastel', colors: [
    { hex: '#FFD6D9', name: 'Rosa Bebê' }, { hex: '#DDD6F3', name: 'Lilás' },
    { hex: '#C8ECD8', name: 'Menta' }, { hex: '#C8E6F5', name: 'Céu' }, { hex: '#FFE4C8', name: 'Pêssego' },
  ]},
  { id: 'dp5', name: 'Terroso', colors: [
    { hex: '#2C2A28', name: 'Carvão' }, { hex: '#C4704A', name: 'Ferrugem' },
    { hex: '#D4A878', name: 'Caramelo' }, { hex: '#F2EBE0', name: 'Creme' }, { hex: '#FAF8F5', name: 'Branco Quente' },
  ]},
  { id: 'dp6', name: 'Rosa & Vinho', colors: [
    { hex: '#6B1F3A', name: 'Vinho' }, { hex: '#9E3A5A', name: 'Marsala' },
    { hex: '#C47A8A', name: 'Rosa Antigo' }, { hex: '#E8B4B8', name: 'Blush' }, { hex: '#F5E6D8', name: 'Champagne' },
  ]},
  { id: 'dp7', name: 'Minimalista', colors: [
    { hex: '#1A1A1A', name: 'Preto' }, { hex: '#4A4A4A', name: 'Grafite' },
    { hex: '#8A8A8A', name: 'Cinza' }, { hex: '#C8C8C8', name: 'Prata' }, { hex: '#F0F0F0', name: 'Gelo' },
  ]},
  { id: 'dp8', name: 'Floral', colors: [
    { hex: '#3D6B47', name: 'Verde Folha' }, { hex: '#9B72A8', name: 'Lilás' },
    { hex: '#C8A8D8', name: 'Lavanda' }, { hex: '#F0C8D8', name: 'Rosa Claro' }, { hex: '#F5E8B8', name: 'Palha' },
  ]},
  { id: 'dp9', name: 'Vintage', colors: [
    { hex: '#5C3D2E', name: 'Mogno' }, { hex: '#A0522D', name: 'Sienna' },
    { hex: '#C8A870', name: 'Âmbar' }, { hex: '#E8D8B0', name: 'Marfim' }, { hex: '#F5F0E8', name: 'Pergaminho' },
  ]},
  { id: 'dp10', name: 'Tropical', colors: [
    { hex: '#1A5C3A', name: 'Selva' }, { hex: '#2E9E5A', name: 'Folha' },
    { hex: '#F7B731', name: 'Abacaxi' }, { hex: '#FF6B6B', name: 'Hibisco' }, { hex: '#4ECDC4', name: 'Turquesa' },
  ]},
  { id: 'dp11', name: 'Nórdico', colors: [
    { hex: '#2C3E50', name: 'Meia-Noite' }, { hex: '#7F8C8D', name: 'Chumbo' },
    { hex: '#BDC3C7', name: 'Névoa' }, { hex: '#ECF0F1', name: 'Neve' }, { hex: '#E8D5B7', name: 'Bege Quente' },
  ]},
  { id: 'dp12', name: 'Outono', colors: [
    { hex: '#7B3F00', name: 'Castanha' }, { hex: '#CC5500', name: 'Abóbora' },
    { hex: '#E8822A', name: 'Laranja Queimado' }, { hex: '#D4A828', name: 'Mostarda' }, { hex: '#8B7355', name: 'Caqui' },
  ]},
  { id: 'dp13', name: 'Jóias', colors: [
    { hex: '#1A1A5E', name: 'Safira' }, { hex: '#2E8B57', name: 'Esmeralda' },
    { hex: '#8B0000', name: 'Rubi' }, { hex: '#4B0082', name: 'Ametista' }, { hex: '#DAA520', name: 'Âmbar Dourado' },
  ]},
  { id: 'dp14', name: 'Candy', colors: [
    { hex: '#FF85A1', name: 'Chiclete' }, { hex: '#FFA3D7', name: 'Cotton Candy' },
    { hex: '#B8F0E6', name: 'Hortelã' }, { hex: '#FFF0A0', name: 'Baunilha' }, { hex: '#C8B4FF', name: 'Lavanda Doce' },
  ]},
  { id: 'dp15', name: 'Urbano', colors: [
    { hex: '#1C1C1E', name: 'Asfalto' }, { hex: '#48484A', name: 'Concreto' },
    { hex: '#98989A', name: 'Cimento' }, { hex: '#FF3B30', name: 'Vermelho Néon' }, { hex: '#F5F5F7', name: 'Alumínio' },
  ]},
  { id: 'dp16', name: 'Aquarela', colors: [
    { hex: '#A8D8EA', name: 'Céu Claro' }, { hex: '#AA96DA', name: 'Lavanda' },
    { hex: '#FCBAD3', name: 'Rosé' }, { hex: '#FFFFD2', name: 'Limão' }, { hex: '#B8F4C8', name: 'Menta' },
  ]},
];

const PaletteCard = ({ palette, onEdit, onDelete, onCopyHex, onSave }) => (
  <div className="card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{palette.name}</div>
      {onSave && (
        <button onClick={onSave} style={{ background: 'var(--accent-bg)', border: 'none', borderRadius: 'var(--r-sm)', padding: '4px 10px', cursor: 'pointer', color: 'var(--accent-dk)', fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500 }}>
          Salvar
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
          <Icon name="edit" size={14} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
          <Icon name="trash" size={14} />
        </button>
      )}
    </div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {palette.colors.map((rawColor, i) => {
        const c = normalizeColor(rawColor);
        return (
          <div key={i} onClick={() => onCopyHex(c.hex)} title={`Copiar ${c.hex}`} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.hex, border: '1px solid var(--line)' }} />
            {c.name && <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 4, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>}
            <div style={{ fontSize: 8, color: 'var(--text3)', fontFamily: 'monospace', marginTop: c.name ? 1 : 4 }}>{c.hex.toUpperCase()}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const ColorRows = ({ colors, onHex, onName, onRemove }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {colors.map((rawColor, i) => {
      const c = normalizeColor(rawColor);
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={c.hex}
            onChange={e => onHex(i, e.target.value)}
            style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
          />
          <div style={{ width: 36, height: 36, borderRadius: 8, background: c.hex, border: '1px solid var(--line)', flexShrink: 0 }} />
          <input
            className="input"
            placeholder="Nome da cor"
            value={c.name}
            onChange={e => onName(i, e.target.value)}
            style={{ flex: 1, padding: '8px 10px', fontSize: 13 }}
          />
          {colors.length > 1 && (
            <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, flexShrink: 0 }}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      );
    })}
  </div>
);

const Inspiracao = ({ onBack }) => {
  const [tab, setTab] = useState('moodboard');
  const [moodboard, saveMoodboard] = useStorage('inspiracao:moodboard', []);
  const [palettes, savePalettes] = useStorage('inspiracao:paletas', DEFAULT_PALETTES);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [editPalette, setEditPalette] = useState(null);
  const [newMood, setNewMood] = useState({ title: '', emoji: '🎨', link: '', bg: '#EDE9E3' });
  const [newPalette, setNewPalette] = useState({ name: '', colors: [{ hex: '#C4704A', name: '' }] });
  const toast = useToast();

  const addMood = () => {
    if (!newMood.title.trim()) return;
    saveMoodboard(m => [...m, { id: newId(), ...newMood }]);
    setNewMood({ title: '', emoji: '🎨', link: '', bg: '#EDE9E3' });
    setShowMoodModal(false);
    toast('Adicionado ao moodboard');
  };

  const addPalette = () => {
    if (!newPalette.name.trim() || newPalette.colors.length === 0) return;
    savePalettes(p => [...p, { id: newId(), name: newPalette.name, colors: newPalette.colors }]);
    setNewPalette({ name: '', colors: [{ hex: '#C4704A', name: '' }] });
    setShowPaletteModal(false);
    toast('Paleta adicionada');
  };

  const addPaletteColor    = ()         => setNewPalette(p => ({ ...p, colors: [...p.colors, { hex: '#AAAAAA', name: '' }] }));
  const removePaletteColor = (i)        => setNewPalette(p => ({ ...p, colors: p.colors.filter((_, idx) => idx !== i) }));
  const updatePaletteHex   = (i, hex)   => setNewPalette(p => ({ ...p, colors: p.colors.map((c, idx) => idx === i ? { ...c, hex  } : c) }));
  const updatePaletteName  = (i, name)  => setNewPalette(p => ({ ...p, colors: p.colors.map((c, idx) => idx === i ? { ...c, name } : c) }));

  const saveEditPalette = () => {
    if (!editPalette) return;
    savePalettes(ps => ps.map(p => p.id === editPalette.id ? editPalette : p));
    setEditPalette(null);
    toast('Paleta atualizada');
  };

  const addEditColor    = ()        => setEditPalette(p => ({ ...p, colors: [...p.colors, { hex: '#AAAAAA', name: '' }] }));
  const removeEditColor = (i)       => setEditPalette(p => ({ ...p, colors: p.colors.filter((_, idx) => idx !== i) }));
  const updateEditHex   = (i, hex)  => setEditPalette(p => ({ ...p, colors: p.colors.map((c, idx) => idx === i ? { ...c, hex  } : c) }));
  const updateEditName  = (i, name) => setEditPalette(p => ({ ...p, colors: p.colors.map((c, idx) => idx === i ? { ...c, name } : c) }));

  const copyHex = (hex) => {
    navigator.clipboard?.writeText(hex).then(() => toast(`Copiado: ${hex}`));
  };

  const detailItem = moodboard.find(m => m.id === openItem);

  return (
    <div className="screen">
      <BackHeader
        title="Inspiração"
        onBack={onBack}
        action={
          <button
            onClick={() => tab === 'moodboard' ? setShowMoodModal(true) : setShowPaletteModal(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}
          >
            <Icon name="plus" size={20} />
          </button>
        }
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Moodboard ── */}
        {tab === 'moodboard' && (
          <div>
            {moodboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
                <div style={{ fontSize: 14 }}>Moodboard vazio</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {moodboard.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setOpenItem(item.id)}
                    style={{ background: item.bg || '#EDE9E3', borderRadius: 'var(--r)', padding: '20px 16px', border: '1px solid var(--line)', position: 'relative', minHeight: 100, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{item.title}</div>
                    {item.link && <div style={{ position: 'absolute', bottom: 8, right: 8 }}><Icon name="link" size={10} color="rgba(0,0,0,0.3)" /></div>}
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowMoodModal(true)}>
              <Icon name="plus" size={16} /> Adicionar ao moodboard
            </button>
          </div>
        )}

        {/* ── Paletas ── */}
        {tab === 'paletas' && (
          <div>
            {/* Minhas paletas */}
            {palettes.length > 0 && (
              <>
                <div className="section-label" style={{ marginBottom: 10 }}>Minhas paletas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {palettes.map(palette => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      onEdit={() => setEditPalette({ ...palette, colors: palette.colors.map(normalizeColor) })}
                      onDelete={() => { savePalettes(p => p.filter(x => x.id !== palette.id)); toast('Removida'); }}
                      onCopyHex={copyHex}
                    />
                  ))}
                </div>
              </>
            )}

            <button className="btn-add" onClick={() => setShowPaletteModal(true)} style={{ marginBottom: 28 }}>
              <Icon name="plus" size={16} /> Nova paleta
            </button>

            {/* Exemplos sempre visíveis */}
            <div className="section-label" style={{ marginBottom: 10 }}>Exemplos prontos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEFAULT_PALETTES.map(palette => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  onCopyHex={copyHex}
                  onSave={() => {
                    const alreadySaved = palettes.some(p => p.name === palette.name);
                    if (alreadySaved) { toast('Já salva'); return; }
                    savePalettes(p => [...p, { ...palette, id: newId() }]);
                    toast(`"${palette.name}" salva`);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: novo item moodboard */}
      <Modal open={showMoodModal} onClose={() => setShowMoodModal(false)} title="Novo item">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" placeholder="Emoji" value={newMood.emoji} onChange={e => setNewMood(m => ({ ...m, emoji: e.target.value }))} style={{ width: 64 }} />
            <input className="input" placeholder="Título / tema" value={newMood.title} onChange={e => setNewMood(m => ({ ...m, title: e.target.value }))} autoFocus style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>Cor de fundo:</label>
            <input type="color" value={newMood.bg} onChange={e => setNewMood(m => ({ ...m, bg: e.target.value }))} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace' }}>{newMood.bg}</span>
          </div>
          <input className="input" placeholder="Link (opcional)" value={newMood.link} onChange={e => setNewMood(m => ({ ...m, link: e.target.value }))} />
          <div style={{ background: newMood.bg, borderRadius: 'var(--r)', padding: '16px', textAlign: 'center', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{newMood.emoji || '🎨'}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{newMood.title || 'Prévia'}</div>
          </div>
          <button className="btn-primary" onClick={addMood}>Adicionar</button>
        </div>
      </Modal>

      {/* Modal: nova paleta */}
      <Modal open={showPaletteModal} onClose={() => setShowPaletteModal(false)} title="Nova paleta">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome da paleta" value={newPalette.name} onChange={e => setNewPalette(p => ({ ...p, name: e.target.value }))} autoFocus />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>Cores</div>
            <ColorRows colors={newPalette.colors} onHex={updatePaletteHex} onName={updatePaletteName} onRemove={removePaletteColor} />
            <button onClick={addPaletteColor} style={{ marginTop: 10, background: 'none', border: '1.5px dashed var(--line)', borderRadius: 'var(--r-sm)', padding: '8px 14px', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
              <Icon name="plus" size={14} /> Adicionar cor
            </button>
          </div>
          <button className="btn-primary" onClick={addPalette}>Salvar paleta</button>
        </div>
      </Modal>

      {/* Modal: editar paleta */}
      <Modal open={!!editPalette} onClose={() => setEditPalette(null)} title="Editar paleta">
        {editPalette && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="input" placeholder="Nome da paleta" value={editPalette.name} onChange={e => setEditPalette(p => ({ ...p, name: e.target.value }))} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>Cores</div>
              <ColorRows colors={editPalette.colors} onHex={updateEditHex} onName={updateEditName} onRemove={removeEditColor} />
              <button onClick={addEditColor} style={{ marginTop: 10, background: 'none', border: '1.5px dashed var(--line)', borderRadius: 'var(--r-sm)', padding: '8px 14px', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
                <Icon name="plus" size={14} /> Adicionar cor
              </button>
            </div>
            <button className="btn-primary" onClick={saveEditPalette}>Salvar</button>
          </div>
        )}
      </Modal>

      {/* Modal: detalhe do moodboard */}
      <Modal open={!!openItem} onClose={() => setOpenItem(null)} title="">
        {detailItem && (
          <div>
            <div style={{ background: detailItem.bg, borderRadius: 'var(--r)', padding: '40px 24px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{detailItem.emoji}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', lineHeight: 1.3 }}>{detailItem.title}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailItem.link && (
                <a href={detailItem.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 'var(--r-sm)', textDecoration: 'none', color: 'var(--accent)', fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 500 }}>
                  <Icon name="link" size={14} color="var(--accent)" /> Abrir link
                </a>
              )}
              <button
                onClick={() => { saveMoodboard(m => m.filter(x => x.id !== detailItem.id)); setOpenItem(null); toast('Removido'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 500 }}
              >
                <Icon name="trash" size={14} color="var(--red)" /> Remover do moodboard
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inspiracao;
