import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Factory,
  Flame,
  Hammer,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { landingMedia } from '../config/landingMedia';

const services = [
  {
    number: '01',
    title: 'Welding',
    description: 'Professional welding and repair work for industrial equipment, structures and steelwork.',
    image: landingMedia.services[0],
    icon: Flame,
  },
  {
    number: '02',
    title: 'Industrial Fabrication',
    description: 'Custom-built components and assemblies, carefully fabricated for the work they need to do.',
    image: landingMedia.services[1],
    icon: Factory,
  },
  {
    number: '03',
    title: 'Field Service',
    description: 'Responsive on-site welding and technical service at your facility or project site.',
    image: landingMedia.services[2],
    icon: Truck,
  },
  {
    number: '04',
    title: 'Maintenance & Repairs',
    description: 'Practical repairs and modifications that help keep industrial equipment in service.',
    image: landingMedia.services[3],
    icon: Wrench,
  },
  {
    number: '05',
    title: 'Steel & Metalwork',
    description: 'Reliable fabrication and installation for steel structures and demanding environments.',
    image: landingMedia.services[4],
    icon: Hammer,
  },
  {
    number: '06',
    title: 'Custom Solutions',
    description: 'A flexible, hands-on response shaped around your project and technical requirements.',
    image: landingMedia.services[5],
    icon: ShieldCheck,
  },
];

const projects = [
  {
    title: 'Industrial equipment welding',
    category: 'Welding · On-site service',
    image: landingMedia.projects[0],
    alt: 'Tjädertuppen worker welding industrial equipment on site',
    className: 'tj-project-feature',
  },
  {
    title: 'Structural steel installation',
    category: 'Steelwork · Installation',
    image: landingMedia.projects[1],
    alt: 'Tjädertuppen worker at a structural steel installation',
  },
  {
    title: 'Field repairs',
    category: 'Maintenance · Field service',
    image: landingMedia.projects[2],
    alt: 'Tjädertuppen worker repairing equipment at a customer site',
  },
  {
    title: 'Welding and fabrication',
    category: 'Fabrication · Welding',
    image: landingMedia.projects[3],
    alt: 'Tjädertuppen welder fabricating steel with sparks',
  },
  {
    title: 'Service across Sweden',
    category: 'Mobile service · Sweden',
    image: landingMedia.projects[4],
    alt: 'Tjädertuppen field service vehicle at an industrial worksite',
  },
];

function PublicPageHero({ eyebrow, title, accent, description, image, imageAlt }) {
  return (
    <section className="tj-public-hero">
      <div className="tj-public-hero-copy">
        <p className="tj-eyebrow"><span /> {eyebrow}</p>
        <h1>{title}<br /><em>{accent}</em></h1>
        <p>{description}</p>
      </div>
      <div className="tj-public-hero-image">
        <img src={image} alt={imageAlt} />
        <span className="tj-public-image-mark">TJ / SVETS &amp; KONSULT</span>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <>
      <PublicPageHero
        eyebrow="About Tjädertuppen"
        title="Built to work."
        accent="Built to last."
        description="A hands-on Swedish welding and industrial-services partner, focused on skilled workmanship and reliable delivery."
        image={landingMedia.company.worker}
        imageAlt="Tjädertuppen worker wearing the company's branded high-visibility jacket"
      />
      <section className="tj-subpage-story tj-section">
        <div>
          <p className="tj-eyebrow"><span /> Skilled people. Solid work.</p>
          <h2>Practical expertise<br />you can <em>rely on.</em></h2>
        </div>
        <div className="tj-subpage-prose">
          <p>
            Tjädertuppen Svets &amp; Konsult brings professional welding, industrial
            fabrication and field service together with a straightforward, dependable
            way of working.
          </p>
          <p>
            We take time to understand the task, plan the work carefully and focus on
            doing it right. From maintenance and repair to fabrication on site, our
            priority is dependable workmanship and a safe, professional delivery.
          </p>
          <ul className="tj-page-checklist">
            <li><Check size={16} /> Professional workmanship</li>
            <li><Check size={16} /> Reliable service and delivery</li>
            <li><Check size={16} /> Flexible field work across Sweden</li>
          </ul>
        </div>
      </section>
      <section className="tj-about-band">
        <img src={landingMedia.company.vehicle} alt="Tjädertuppen branded service vehicle" loading="lazy" />
        <div><p className="tj-eyebrow tj-eyebrow-light"><span /> Svets &amp; Konsult</p><h2>Ready when<br />the work calls.</h2></div>
      </section>
      <PageContactPrompt />
    </>
  );
}

export function ServicesPage() {
  return (
    <>
      <section className="tj-page-heading tj-section">
        <p className="tj-eyebrow"><span /> Welding · Fabrication · Field service</p>
        <h1>Industrial work.<br /><em>Done properly.</em></h1>
        <p>Professional, practical support from experienced hands, on site and in the workshop.</p>
      </section>
      <section className="tj-public-services tj-section">
        {services.map(({ number, title, description, image, icon: Icon }) => (
          <article className="tj-public-service" key={number}>
            <div className="tj-public-service-photo"><img src={image} alt="" loading="lazy" /></div>
            <div className="tj-public-service-copy">
              <span className="tj-public-service-number">{number}</span>
              <Icon size={21} strokeWidth={1.6} />
              <h2>{title}</h2>
              <p>{description}</p>
              <Link to="/contact">Discuss your requirements <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </section>
      <PageContactPrompt />
    </>
  );
}

export function ProjectsPage() {
  return (
    <>
      <section className="tj-page-heading tj-section">
        <p className="tj-eyebrow"><span /> Work in the real world</p>
        <h1>On the move.<br /><em>On the job.</em></h1>
        <p>A selection of Tjädertuppen's welding, fabrication and field-service work across Sweden.</p>
      </section>
      <section className="tj-project-grid tj-section">
        {projects.map(({ title, category, image, alt, className = '' }, index) => (
          <figure className={`tj-project ${className}`} key={title}>
            <img src={image} alt={alt} loading="lazy" />
            <figcaption><span>0{index + 1} / {category}</span><strong>{title}</strong><ArrowUpRight size={17} /></figcaption>
          </figure>
        ))}
      </section>
      <section className="tj-project-note tj-section">
        <MapPin size={17} />
        <p>Every job is different. We bring the right tools, practical experience and a reliable approach to your site.</p>
        <Link to="/contact">Talk about a project <ArrowRight size={15} /></Link>
      </section>
      <PageContactPrompt />
    </>
  );
}

export function ContactPage() {
  const [copyStatus, setCopyStatus] = useState('');

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText('+46 70 286 27 73');
      setCopyStatus('Number copied');
    } catch {
      setCopyStatus('Copy unavailable — call +46 70 286 27 73');
    }
  };

  return (
    <>
      <section className="tj-contact-page">
        <div className="tj-contact-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> Contact Tjädertuppen</p>
          <h1>Let’s get<br />to <em>work.</em></h1>
          <p>Have a welding, fabrication or field-service job to discuss? Call us and speak directly about what you need.</p>
          <div className="tj-contact-actions">
            <a className="tj-button tj-button-lime" href="tel:+46702862773"><Phone size={16} /> Call +46 70 286 27 73</a>
            <button className="tj-contact-copy-button" type="button" onClick={copyPhoneNumber}>
              <Copy size={15} /> Copy number
            </button>
          </div>
          <span className="tj-contact-copy-status" role="status" aria-live="polite">{copyStatus}</span>
          <span className="tj-contact-response-note"><span /> Available for work across Sweden</span>
        </div>
        <div className="tj-contact-image">
          <img src={landingMedia.company.contact} alt="Tjädertuppen welder working on industrial equipment" />
          <span className="tj-contact-image-caption"><span>Skilled hands. Solid work.</span><span>SVETS &amp; KONSULT</span></span>
        </div>
      </section>
      <section className="tj-contact-details tj-section">
        <a className="tj-contact-detail" href="tel:+46702862773">
          <span className="tj-contact-detail-icon"><Phone size={18} /></span>
          <span className="tj-contact-detail-label">Call us directly</span>
          <strong>+46 70 286 27 73</strong>
          <span className="tj-contact-detail-hint">Tap to call <ArrowUpRight size={14} /></span>
        </a>
        <div className="tj-contact-detail">
          <span className="tj-contact-detail-icon"><MapPin size={18} /></span>
          <span className="tj-contact-detail-label">Where we work</span>
          <strong>Across Sweden</strong>
          <span className="tj-contact-detail-hint">Nationwide field service</span>
        </div>
        <div className="tj-contact-detail">
          <span className="tj-contact-detail-icon"><Wrench size={18} /></span>
          <span className="tj-contact-detail-label">How we can help</span>
          <strong>Welding &amp; fabrication</strong>
          <span className="tj-contact-detail-hint">Repairs · Field service · Metalwork</span>
        </div>
      </section>
      <section className="tj-contact-faq tj-section">
        <div className="tj-contact-faq-heading">
          <p className="tj-eyebrow"><span /> Before you call</p>
          <h2>A few useful<br /><em>details.</em></h2>
          <p>Not sure where to start? Here are a few things we can talk through together.</p>
        </div>
        <div className="tj-contact-faq-list">
          <details>
            <summary>What kind of work can I ask about?<ChevronDown size={17} /></summary>
            <p>Get in touch about welding, industrial fabrication, steelwork, repairs, maintenance or on-site technical service.</p>
          </details>
          <details>
            <summary>Can you travel to our site?<ChevronDown size={17} /></summary>
            <p>Yes. Tjädertuppen provides field service across Sweden. Call to discuss your location and what the job requires.</p>
          </details>
          <details>
            <summary>What information should I have ready?<ChevronDown size={17} /></summary>
            <p>A short description of the job, where the work is needed and any timing or site requirements is a helpful place to start.</p>
          </details>
        </div>
      </section>
    </>
  );
}

function PageContactPrompt() {
  return (
    <section className="tj-subpage-cta">
      <div>
        <p className="tj-eyebrow tj-eyebrow-light"><span /> Let's get to work</p>
        <h2>Need a reliable<br />pair of hands?</h2>
        <p>Tell us what you need. We’ll talk through the work and the best way forward.</p>
      </div>
      <Link to="/contact" className="tj-button tj-button-lime">Contact Tjädertuppen <ArrowUpRight size={16} /></Link>
    </section>
  );
}
