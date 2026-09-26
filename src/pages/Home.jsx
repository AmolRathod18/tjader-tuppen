import React from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle2, ClipboardCheck, Clock3, MapPin, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/TJADERTUPPEN_Logo.jpeg';
import PublicNavbar from '../components/layout/PublicNavbar';

const workflow = [
  { number: '01', title: 'Plan', text: 'Set up the company, project, team, and assignment.' },
  { number: '02', title: 'Track', text: 'Log hours, overtime, travel, and notes as work happens.' },
  { number: '03', title: 'Report', text: 'Review totals and export a polished report in seconds.' },
];

export default function Home() {
  return (
    <main className="home-page">
      <PublicNavbar />

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker"><span /> Field operations / Tjädertuppen</p>
          <h1>Work moves.<br /><em>You stay ahead.</em></h1>
          <p className="home-lede">One clear command centre for the people, projects, hours, and travel behind reliable field work.</p>
          <div className="home-actions">
            <Link to="/login" className="home-primary-action">Open admin workspace <ArrowUpRight size={18} /></Link>
            <a href="#workflow" className="home-secondary-action">Explore the workflow <ArrowDownRight size={17} /></a>
          </div>
        </div>
        <div className="home-live-panel" aria-label="Live workspace preview">
          <div className="home-live-topline"><span><i /> Live workspace</span><small>Today, 08:42</small></div>
          <div className="home-live-title"><div><span className="home-live-eyebrow">Weekly operations</span><strong>In control</strong></div><Activity size={24} /></div>
          <div className="home-live-bars" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="home-live-total"><span>Hours logged this week</span><strong>127.5<span> h</span></strong></div>
          <div className="home-live-list">
            <div><span className="home-live-icon"><UsersRound size={15} /></span><span><b>Active team</b><small>People on projects</small></span><strong>12</strong></div>
            <div><span className="home-live-icon"><MapPin size={15} /></span><span><b>Travel tracked</b><small>Distance this month</small></span><strong>842 km</strong></div>
          </div>
          <div className="home-live-stamp">TJ <span>OPERATIONS / 2026</span></div>
        </div>
      </section>

      <section className="home-capabilities" id="workflow">
        <div className="home-section-intro">
          <p className="home-kicker"><span /> Everything important</p>
          <h2>Less chasing.<br />More doing.</h2>
          <p className="home-section-copy">Replace scattered notes and delayed updates with a shared operational picture that is easy to trust.</p>
        </div>
        <div className="home-workflow-list">
          {workflow.map(item => (
            <article className="home-workflow-item" key={item.number}>
              <span>{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={18} />
            </article>
          ))}
        </div>
      </section>

      <section className="home-proof-strip" aria-label="Key capabilities">
        <div><Clock3 size={19} /><strong>Time intelligence</strong><span>Normal hours, overtime, weekends</span></div>
        <div><ClipboardCheck size={19} /><strong>Project clarity</strong><span>Companies, people, assignments</span></div>
        <div><BarChart3 size={19} /><strong>Shareable reporting</strong><span>Clean weekly and monthly exports</span></div>
        <div><CheckCircle2 size={19} /><strong>One source of truth</strong><span>Details that stay up to date</span></div>
      </section>

      <footer className="home-footer">
        <span>Tjädertuppen Svets och konsult</span>
        <span>People / Projects / Progress</span>
      </footer>
    </main>
  );
}