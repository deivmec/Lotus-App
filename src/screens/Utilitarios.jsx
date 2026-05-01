import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const TABS = [
  { id: 'calc',     label: 'Calculadora' },
  { id: 'moeda',    label: 'Moedas' },
  { id: 'medidas',  label: 'Medidas' },
  { id: 'contagem', label: 'Contagem' },
];

const RATES = { BRL: 1, USD: 0.19, EUR: 0.18, GBP: 0.15, JPY: 28.5, ARS: 188 };
const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS'];

const CALC_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

const WEIGHT_UNITS = [
  { id: 'kg',  label: 'kg',  toBase: 1,      fromBase: 1 },
  { id: 'g',   label: 'g',   toBase: 0.001,  fromBase: 1000 },
  { id: 'lb',  label: 'lb',  toBase: 0.4536, fromBase: 2.2046 },
  { id: 'oz',  label: 'oz',  toBase: 0.0283, fromBase: 35.274 },
];
const DIST_UNITS = [
  { id: 'km',  label: 'km',       toBase: 1,        fromBase: 1 },
  { id: 'm',   label: 'm',        toBase: 0.001,    fromBase: 1000 },
  { id: 'mi',  label: 'mi',       toBase: 1.60934,  fromBase: 0.62137 },
  { id: 'ft',  label: 'ft',       toBase: 0.0003048, fromBase: 3280.84 },
  { id: 'in',  label: 'Polegadas (in)', toBase: 0.0254, fromBase: 39.3701 },
];

const convertUnit = (value, fromUnit, toUnit, units) => {
  const v = parseFloat(value) || 0;
  const from = units.find(u => u.id === fromUnit);
  const to = units.find(u => u.id === toUnit);
  if (!from || !to) return '0';
  const inBase = v * from.toBase;
  const result = inBase * to.fromBase;
  return result % 1 === 0 ? String(result) : result.toFixed(4).replace(/\.?0+$/, '');
};

const convertTemp = (value, from, to) => {
  const v = parseFloat(value);
  if (isNaN(v)) return '—';
  if (from === to) return String(v);
  if (from === 'C' && to === 'F') return ((v * 9 / 5) + 32).toFixed(1);
  if (from === 'F' && to === 'C') return ((v - 32) * 5 / 9).toFixed(1);
  return '—';
};

const UnitConverter = ({ label, units, value, setValue, fromUnit, setFrom, toUnit, setTo }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
      <div>
        <input className="input" type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0" />
        <select className="input" value={fromUnit} onChange={e => setFrom(e.target.value)} style={{ marginTop: 6 }}>
          {units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </div>
      <button onClick={() => { setFrom(toUnit); setTo(fromUnit); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8 }}>
        <Icon name="arrow" size={18} />
      </button>
      <div>
        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r-sm)', padding: '12px', textAlign: 'center', minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)' }}>
            {convertUnit(value, fromUnit, toUnit, units)}
          </span>
        </div>
        <select className="input" value={toUnit} onChange={e => setTo(e.target.value)} style={{ marginTop: 6 }}>
          {units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
      </div>
    </div>
  </div>
);

const daysUntil = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
};

const Utilitarios = ({ onBack }) => {
  const [tab, setTab] = useState('calc');
  const toast = useToast();

  // Calculadora
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [reset, setReset] = useState(false);

  const calcPress = (btn) => {
    if (btn === 'C') { setDisplay('0'); setPrev(null); setOp(null); setReset(false); return; }
    if (btn === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if (btn === '±') { setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d); return; }
    if (btn === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }
    if (['+', '−', '×', '÷'].includes(btn)) { setPrev(parseFloat(display)); setOp(btn); setReset(true); return; }
    if (btn === '=') {
      if (prev === null || !op) return;
      const cur = parseFloat(display);
      const ops = { '+': prev + cur, '−': prev - cur, '×': prev * cur, '÷': prev / cur };
      const result = ops[op];
      setDisplay(String(Number.isFinite(result) ? result : 'Erro'));
      setPrev(null); setOp(null); setReset(true); return;
    }
    if (btn === '.') {
      if (reset) { setDisplay('0.'); setReset(false); return; }
      if (!display.includes('.')) setDisplay(d => d + '.');
      return;
    }
    if (reset) { setDisplay(btn); setReset(false); return; }
    setDisplay(d => d === '0' ? btn : d + btn);
  };

  const isOp = (b) => ['+', '−', '×', '÷'].includes(b);

  // Moeda
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('BRL');
  const [to, setTo] = useState('USD');
  const convert = () => ((parseFloat(amount) || 0) / RATES[from] * RATES[to]).toFixed(2);

  // Medidas
  const [weightVal, setWeightVal] = useState('');
  const [weightFrom, setWeightFrom] = useState('kg');
  const [weightTo, setWeightTo] = useState('lb');
  const [distVal, setDistVal] = useState('');
  const [distFrom, setDistFrom] = useState('km');
  const [distTo, setDistTo] = useState('in');
  const [tempVal, setTempVal] = useState('');
  const [tempFrom, setTempFrom] = useState('C');
  const [tempTo, setTempTo] = useState('F');

  // Contagem
  const [countdowns, saveCountdowns] = useStorage('utilitarios:countdowns', []);
  const [showCdModal, setShowCdModal] = useState(false);
  const [newCd, setNewCd] = useState({ label: '', date: '' });

  const addCountdown = () => {
    if (!newCd.label.trim() || !newCd.date) return;
    saveCountdowns(cs => [...cs, { id: newId(), ...newCd }]);
    setNewCd({ label: '', date: '' });
    setShowCdModal(false);
    toast('Contagem criada');
  };

  const delCountdown = (id) => { saveCountdowns(cs => cs.filter(c => c.id !== id)); toast('Removido'); };

  return (
    <div className="screen">
      <BackHeader
        title="Utilitários"
        onBack={onBack}
        action={tab === 'contagem' ? (
          <button onClick={() => setShowCdModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
            <Icon name="plus" size={20} />
          </button>
        ) : null}
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Calculadora ── */}
        {tab === 'calc' && (
          <div>
            <div style={{ background: 'var(--text)', borderRadius: 'var(--r)', padding: '24px 20px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, minHeight: 16, textAlign: 'right' }}>
                {prev !== null ? `${prev} ${op}` : ''}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: display.length > 10 ? 28 : 42, color: 'white', textAlign: 'right', lineHeight: 1, letterSpacing: '-0.02em', wordBreak: 'break-all' }}>
                {display}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CALC_BUTTONS.flat().map((btn, i) => {
                const isOper = isOp(btn);
                const isEq = btn === '=';
                const isZero = btn === '0';
                const isClear = btn === 'C';
                return (
                  <button key={i} onClick={() => calcPress(btn)} style={{ padding: '18px', borderRadius: 'var(--r)', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 18, fontWeight: 500, gridColumn: isZero ? 'span 2' : undefined, background: isEq ? 'var(--accent)' : isOper ? 'var(--accent-bg)' : isClear ? 'var(--bg3)' : 'white', color: isEq ? 'white' : isOper ? 'var(--accent)' : 'var(--text)', border: `1px solid ${isEq ? 'var(--accent)' : 'var(--line)'}`, transition: 'transform 0.1s' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Moedas ── */}
        {tab === 'moeda' && (
          <div>
            <div className="section-label">Taxas aproximadas · sem internet</div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Valor</label>
                <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>De</label>
                  <select className="input" value={from} onChange={e => setFrom(e.target.value)}>
                    {MOEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={() => { setFrom(to); setTo(from); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', marginTop: 20, padding: 8 }}>
                  <Icon name="arrow" size={18} />
                </button>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Para</label>
                  <select className="input" value={to} onChange={e => setTo(e.target.value)}>
                    {MOEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r-sm)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{amount || 0} {from} =</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--text)' }}>{convert()} <span style={{ fontSize: 18 }}>{to}</span></div>
              </div>
            </div>
            <div className="section-label">Taxas base (vs BRL)</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {MOEDAS.filter(m => m !== 'BRL').map((m, i, arr) => (
                <div key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{m}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'monospace' }}>1 {m} = R$ {(1 / RATES[m]).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Medidas ── */}
        {tab === 'medidas' && (
          <div>
            <UnitConverter label="Peso" units={WEIGHT_UNITS} value={weightVal} setValue={setWeightVal} fromUnit={weightFrom} setFrom={setWeightFrom} toUnit={weightTo} setTo={setWeightTo} />
            <UnitConverter label="Distância" units={DIST_UNITS} value={distVal} setValue={setDistVal} fromUnit={distFrom} setFrom={setDistFrom} toUnit={distTo} setTo={setDistTo} />
            <div className="card">
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Temperatura</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                <div>
                  <input className="input" type="number" value={tempVal} onChange={e => setTempVal(e.target.value)} placeholder="0" />
                  <select className="input" value={tempFrom} onChange={e => setTempFrom(e.target.value)} style={{ marginTop: 6 }}>
                    <option value="C">°C</option>
                    <option value="F">°F</option>
                  </select>
                </div>
                <button onClick={() => { setTempFrom(tempTo); setTempTo(tempFrom); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8 }}>
                  <Icon name="arrow" size={18} />
                </button>
                <div>
                  <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r-sm)', padding: '12px', textAlign: 'center', minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)' }}>
                      {tempVal ? convertTemp(tempVal, tempFrom, tempTo) : '—'}
                    </span>
                  </div>
                  <select className="input" value={tempTo} onChange={e => setTempTo(e.target.value)} style={{ marginTop: 6 }}>
                    <option value="C">°C</option>
                    <option value="F">°F</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Contagem ── */}
        {tab === 'contagem' && (
          <div>
            {countdowns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 14 }}>Nenhuma contagem ainda</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {countdowns.map(cd => {
                  const days = daysUntil(cd.date);
                  const isPast = days < 0;
                  const isToday = days === 0;
                  return (
                    <div key={cd.id} className="card" style={{ position: 'relative', textAlign: 'center', padding: '20px 16px' }}>
                      <button
                        onClick={() => delCountdown(cd.id)}
                        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 52, lineHeight: 1, color: isPast ? 'var(--text3)' : isToday ? 'var(--green)' : 'var(--text)', marginBottom: 4 }}>
                        {isToday ? '🎉' : Math.abs(days)}
                      </div>
                      {!isToday && (
                        <div style={{ fontSize: 13, color: isPast ? 'var(--text3)' : 'var(--text2)', marginBottom: 8 }}>
                          {isPast ? `dia${Math.abs(days) !== 1 ? 's' : ''} atrás` : `dia${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
                        </div>
                      )}
                      {isToday && <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>Hoje!</div>}
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{cd.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{cd.date}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowCdModal(true)}>
              <Icon name="plus" size={16} /> Nova contagem
            </button>
          </div>
        )}
      </div>

      <Modal open={showCdModal} onClose={() => setShowCdModal(false)} title="Nova contagem regressiva">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Ex: Viagem para o Japão" value={newCd.label} onChange={e => setNewCd(c => ({ ...c, label: e.target.value }))} autoFocus />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Data do evento</label>
            <input className="input" type="date" value={newCd.date} onChange={e => setNewCd(c => ({ ...c, date: e.target.value }))} />
          </div>
          <button className="btn-primary" onClick={addCountdown}>Criar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Utilitarios;
