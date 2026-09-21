import React, { useState } from 'react';
import {
  ArrowDown, ArrowRight, BarChart3, Building2, ClipboardCheck,
  ClipboardList, FileDown, FolderKanban, LayoutDashboard, Users,
} from 'lucide-react';

const SYSTEM_STEPS = [
  { id: 'dashboard', label: 'Dashboard', purpose: 'One operational view of the business.', icon: LayoutDashboard, meta: 'Overview' },
  { id: 'companies', label: 'Client Companies', purpose: 'Keep customer contacts and company records together.', icon: Building2, meta: 'Customers' },
  { id: 'projects', label: 'Projects', purpose: 'Define scope, location, dates, and status.', icon: FolderKanban, meta: 'Planning' },
  { id: 'employees', label: 'Employees', purpose: 'Maintain the skilled workforce and roles.', icon: Users, meta: 'People' },
  { id: 'assignments', label: 'Assignments', purpose: 'Connect the right people to each project.', icon: ClipboardCheck, meta: 'Resources' },
  { id: 'work-entry', label: 'Daily Work Entry', purpose: 'Capture site activity and time as work happens.', icon: ClipboardList, meta: 'Execution' },
  { id: 'reports', label: 'Reports', purpose: 'Turn recorded work into a clear project record.', icon: BarChart3, meta: 'Insights' },
  { id: 'export', label: 'PDF Export', purpose: 'Deliver a finished report ready to share.', icon: FileDown, meta: 'Delivery' },
];

function SystemFrame() {
  return (
    <div className="system-structure" aria-hidden="true">
      <div className="system-floor" />
      <div className="system-frame system-frame-back"><i /><i /><i /><b /><b /></div>
      <div className="system-frame system-frame-front"><i /><i /><i /><b /><b /></div>
      <div className="system-crossbeam system-crossbeam-one" />
      <div className="system-crossbeam system-crossbeam-two" />
      <span className="system-weld system-weld-one" /><span className="system-weld system-weld-two" />
      <span className="system-datum datum-one" /><span className="system-datum datum-two" /><span className="system-datum datum-three" />
    </div>
  );
}

export default function SystemOverview3D() {
  const [activeStep, setActiveStep] = useState(0);
  const active = SYSTEM_STEPS[activeStep];

  return (
    <section className="system-overview">
      <header className="system-overview-header">
        <div>
          <div className="eyebrow-label"><span className="eyebrow-rule" /> 3D SYSTEM OVERVIEW</div>
          <h2>How TJÄDERTUPPEN works</h2>
          <p>From a client brief to a finished, shareable project report.</p>
        </div>
        <div className="system-status"><span /> SYSTEM FLOW <strong>8 stages</strong></div>
      </header>

      <div className="system-overview-canvas">
        <SystemFrame />
        <div className="system-canvas-copy">
          <span>MANAGEMENT SYSTEM / DATA FLOW</span>
          <strong>{String(activeStep + 1).padStart(2, '0')} / {String(SYSTEM_STEPS.length).padStart(2, '0')}</strong>
          <small>SELECT A STAGE TO INSPECT</small>
        </div>
        <div className="system-active-note">
          <span className="system-active-index">{String(activeStep + 1).padStart(2, '0')}</span>
          <div><strong>{active.label}</strong><span>{active.purpose}</span></div>
        </div>
      </div>

      <div className="system-flow" aria-label="TJÄDERTUPPEN management system flow">
        {SYSTEM_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          return (
            <React.Fragment key={step.id}>
              <button type="button" className={`system-stage${isActive ? ' active' : ''}`} onClick={() => setActiveStep(index)} aria-pressed={isActive}>
                <span className="system-stage-top"><small>{String(index + 1).padStart(2, '0')}</small><span>{step.meta}</span></span>
                <span className="system-stage-icon"><Icon size={18} /></span>
                <strong>{step.label}</strong>
                <span>{step.purpose}</span>
              </button>
              {index < SYSTEM_STEPS.length - 1 && <span className="system-flow-arrow"><ArrowRight size={14} /></span>}
            </React.Fragment>
          );
        })}
      </div>

      <div className="system-mobile-flow-hint"><ArrowDown size={14} /> Select a stage to follow the data flow</div>
    </section>
  );
}