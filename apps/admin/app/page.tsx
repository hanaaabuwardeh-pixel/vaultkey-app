const stats = [['Under review', '18'], ['Changes required', '6'], ['Valuation disputes', '4'], ['Published today', '12']];

export default function AdminHome() {
  return (
    <main>
      <header><div className="mark">VK</div><div><h1>Review Operations</h1><p>Independent qualification, moderation and publishing</p></div></header>
      <section className="stats">{stats.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>
      <section className="panel">
        <div className="panelHeading"><div><h2>Priority review queue</h2><p>Sorted by risk and age</p></div><button>Review next</button></div>
        {['Commercial · Dallas, TX · Low confidence', 'Multifamily · Plano, TX · Documents incomplete', 'Land · Frisco, TX · Appraisal required'].map((item) => <div className="row" key={item}><span>{item}</span><b>Open →</b></div>)}
      </section>
    </main>
  );
}
