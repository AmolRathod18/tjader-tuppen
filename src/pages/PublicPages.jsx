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
import { Link, useParams } from 'react-router-dom';
import { landingMedia } from '../config/landingMedia';
import { useLanguage } from '../context/LanguageContext';
import { publicProjects, publicServices } from '../config/publicCatalog';

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
    alt: 'Tjädertuppen worker welding blue industrial equipment outdoors',
    className: 'tj-project-feature',
  },
  {
    title: 'Structural steel installation',
    category: 'Steelwork · Installation',
    image: landingMedia.projects[1],
    alt: 'Tjädertuppen worker assembling steel structure above a worksite',
  },
  {
    title: 'Field repairs',
    category: 'Maintenance · Field service',
    image: landingMedia.projects[2],
    alt: 'Tjädertuppen worker repairing a trailer at a customer site',
  },
  {
    title: 'Welding and fabrication',
    category: 'Fabrication · Welding',
    image: landingMedia.projects[3],
    alt: 'Tjädertuppen welder working beneath a steel framework',
  },
  {
    title: 'Service across Sweden',
    category: 'Mobile service · Sweden',
    image: landingMedia.projects[4],
    alt: 'Tjädertuppen worker beside the branded field service pickup',
  },
];

function PublicPageHero({ eyebrow, title, accent, description, image, imageAlt }) {
  const { tp } = useLanguage();

  return (
    <section className="tj-public-hero" data-header-theme="light">
      <div className="tj-public-hero-copy">
        <p className="tj-eyebrow"><span /> {tp(eyebrow)}</p>
        <h1>{tp(title)}<br /><em>{tp(accent)}</em></h1>
        <p>{tp(description)}</p>
      </div>
      <div className="tj-public-hero-image">
        <img src={image} alt={tp(imageAlt)} />
        <span className="tj-public-image-mark">TJ / SVETS &amp; KONSULT</span>
      </div>
    </section>
  );
}

export function AboutPage() {
  const { tp } = useLanguage();

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
      <section className="tj-subpage-story tj-section" data-header-theme="light">
        <div>
          <p className="tj-eyebrow"><span /> {tp('Skilled people. Solid work.')}</p>
          <h2>{tp('Practical expertise')}<br />{tp('you can rely on.')}</h2>
        </div>
        <div className="tj-subpage-prose">
          <p>
            {tp('Tjädertuppen Svets & Konsult brings professional welding, industrial fabrication and field service together with a straightforward, dependable way of working.')}
          </p>
          <p>
            {tp('We take time to understand the task, plan the work carefully and focus on doing it right. From maintenance and repair to fabrication on site, our priority is dependable workmanship and a safe, professional delivery.')}
          </p>
          <ul className="tj-page-checklist">
            <li><Check size={16} /> {tp('Professional workmanship')}</li>
            <li><Check size={16} /> {tp('Reliable service and delivery')}</li>
            <li><Check size={16} /> {tp('Flexible field work across Sweden')}</li>
          </ul>
        </div>
      </section>
      <section className="tj-about-band" data-header-theme="dark">
        <img src={landingMedia.company.vehicle} alt={tp('Tjädertuppen branded service vehicle')} loading="lazy" />
        <div><p className="tj-eyebrow tj-eyebrow-light"><span /> Svets &amp; Konsult</p><h2>{tp('Ready when')}<br />{tp('the work calls.')}</h2></div>
      </section>
      <PageContactPrompt />
    </>
  );
}

export function ServicesPage() {
  const { tp } = useLanguage();

  return (
    <>
      <section className="tj-page-heading tj-section" data-header-theme="light">
        <p className="tj-eyebrow"><span /> {tp('Welding · Fabrication · Field service')}</p>
        <h1>{tp('Industrial work.')}<br /><em>{tp('Done properly.')}</em></h1>
        <p>{tp('Professional, practical support from experienced hands, on site and in the workshop.')}</p>
      </section>
      <section className="tj-public-services tj-section" data-header-theme="light">
        {services.map(({ number, title, description, image, icon: Icon }) => (
          <article className="tj-public-service" key={number}>
            <div className="tj-public-service-photo"><img src={image} alt="" loading="lazy" /></div>
            <div className="tj-public-service-copy">
              <span className="tj-public-service-number">{number}</span>
              <Icon size={21} strokeWidth={1.6} />
              <h2>{tp(title)}</h2>
              <p>{tp(description)}</p>
              <Link to="/contact">{tp('Discuss your requirements')} <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </section>
      <PageContactPrompt />
    </>
  );
}

export function ProjectsPage() {
  const { tp } = useLanguage();

  return (
    <>
      <section className="tj-page-heading tj-section" data-header-theme="light">
        <p className="tj-eyebrow"><span /> {tp('Work in the real world')}</p>
        <h1>{tp('On the move.')}<br /><em>{tp('On the job.')}</em></h1>
        <p>{tp("A selection of Tjädertuppen's welding, fabrication and field-service work across Sweden.")}</p>
      </section>
      <section className="tj-project-grid tj-section" data-header-theme="dark">
        {projects.map(({ title, category, image, alt, className = '' }, index) => (
          <figure className={`tj-project ${className}`} key={title}>
            <img src={image} alt={tp(alt)} loading="lazy" />
            <figcaption><span>0{index + 1} / {tp(category)}</span><strong>{tp(title)}</strong><ArrowUpRight size={17} /></figcaption>
          </figure>
        ))}
      </section>
      <section className="tj-project-note tj-section" data-header-theme="light">
        <MapPin size={17} />
        <p>{tp('Every job is different. We bring the right tools, practical experience and a reliable approach to your site.')}</p>
        <Link to="/contact">{tp('Talk about a project')} <ArrowRight size={15} /></Link>
      </section>
      <PageContactPrompt />
    </>
  );
}

export function ContactPage() {
  const { tp } = useLanguage();
  const [copyStatus, setCopyStatus] = useState('');

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText('+46 70 286 27 73');
      setCopyStatus(tp('Number copied'));
    } catch {
      setCopyStatus(tp('Copy unavailable — call +46 70 286 27 73'));
    }
  };

  return (
    <>
      <section className="tj-contact-page" data-header-theme="dark">
        <img
          className="tj-contact-banner-image"
          src={landingMedia.company.worker}
          alt={tp('Tjädertuppen worker on an industrial service site')}
        />
        <div className="tj-contact-image-note">
          <span className="tj-contact-image-note-icon"><MapPin size={17} /></span>
          <span>
            <strong>{tp('On-site service')}</strong>
            <small>{tp('Across Sweden')}</small>
          </span>
        </div>
        <div className="tj-contact-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Contact Tjädertuppen')}</p>
          <h1>{tp('Let’s get')}<br />{tp('to work.')}</h1>
          <p>{tp('Have a welding, fabrication or field-service job to discuss? Call us and speak directly about what you need.')}</p>
          <div className="tj-contact-actions">
            <a className="tj-button tj-button-lime" href="tel:+46702862773"><Phone size={16} /> {tp('Call +46 70 286 27 73')}</a>
            <button className="tj-contact-copy-button" type="button" onClick={copyPhoneNumber}>
              <Copy size={15} /> {tp('Copy number')}
            </button>
          </div>
          <span className="tj-contact-copy-status" role="status" aria-live="polite">{copyStatus}</span>
          <span className="tj-contact-response-note"><span /> {tp('Available for work across Sweden')}</span>
        </div>
      </section>
      <section className="tj-contact-details tj-section" data-header-theme="light">
        <a className="tj-contact-detail" href="tel:+46702862773">
          <span className="tj-contact-detail-icon"><Phone size={18} /></span>
          <span className="tj-contact-detail-label">{tp('Call us directly')}</span>
          <strong>+46 70 286 27 73</strong>
          <span className="tj-contact-detail-hint">{tp('Tap to call')} <ArrowUpRight size={14} /></span>
        </a>
        <div className="tj-contact-detail">
          <span className="tj-contact-detail-icon"><MapPin size={18} /></span>
          <span className="tj-contact-detail-label">{tp('Where we work')}</span>
          <strong>{tp('Across Sweden')}</strong>
          <span className="tj-contact-detail-hint">{tp('Nationwide field service')}</span>
        </div>
        <div className="tj-contact-detail">
          <span className="tj-contact-detail-icon"><Wrench size={18} /></span>
          <span className="tj-contact-detail-label">{tp('How we can help')}</span>
          <strong>{tp('Welding & fabrication')}</strong>
          <span className="tj-contact-detail-hint">{tp('Repairs · Field service · Metalwork')}</span>
        </div>
      </section>
      <section className="tj-contact-faq tj-section" data-header-theme="light">
        <div className="tj-contact-faq-heading">
          <p className="tj-eyebrow"><span /> {tp('Before you call')}</p>
          <h2>{tp('A few useful')}<br /><em>{tp('details.')}</em></h2>
          <p>{tp('Not sure where to start? Here are a few things we can talk through together.')}</p>
        </div>
        <div className="tj-contact-faq-list">
          <details>
            <summary>{tp('What kind of work can I ask about?')}<ChevronDown size={17} /></summary>
            <p>{tp('Get in touch about welding, industrial fabrication, steelwork, repairs, maintenance or on-site technical service.')}</p>
          </details>
          <details>
            <summary>{tp('Can you travel to our site?')}<ChevronDown size={17} /></summary>
            <p>{tp('Yes. Tjädertuppen provides field service across Sweden. Call to discuss your location and what the job requires.')}</p>
          </details>
          <details>
            <summary>{tp('What information should I have ready?')}<ChevronDown size={17} /></summary>
            <p>{tp('A short description of the job, where the work is needed and any timing or site requirements is a helpful place to start.')}</p>
          </details>
        </div>
      </section>
    </>
  );
}

function PageContactPrompt() {
  const { tp } = useLanguage();

  return (
    <section className="tj-subpage-cta" data-header-theme="dark">
      <div>
        <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp("Let's get to work")}</p>
        <h2>{tp('Need a reliable')}<br />{tp('pair of hands?')}</h2>
        <p>{tp('Tell us what you need. We’ll talk through the work and the best way forward.')}</p>
      </div>
      <Link to="/contact" className="tj-button tj-button-lime">{tp('Contact Tjädertuppen')} <ArrowUpRight size={16} /></Link>
    </section>
  );
}

export function PublicDetailPage({ type }) {
  const { slug } = useParams();
  const { tp } = useLanguage();
  const catalogue = type === 'service' ? publicServices : publicProjects;
  const item = catalogue.find(entry => entry.path.endsWith(`/${slug}`));

  if (!item) {
    return (
      <section className="tj-page-heading tj-section" data-header-theme="light">
        <p className="tj-eyebrow"><span /> {tp('Page not found')}</p>
        <h1>{tp('This page is not available.')}</h1>
        <Link to={type === 'service' ? '/services' : '/projects'} className="tj-button tj-button-lime">
          {tp(type === 'service' ? 'Explore all services' : 'Explore all projects')} <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const Icon = item.icon;
  const category = type === 'service' ? 'Service' : 'Project';
  const translatedTitle = tp(item.title);

  return (
    <>
      <section className="tj-detail-hero" data-header-theme="dark">
        <img className="tj-detail-hero-image" src={item.images[0]} alt="" />
        <div className="tj-detail-hero-shade" />
        <div className="tj-detail-hero-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp(category)} / Tjädertuppen Svets &amp; Konsult</p>
          <h1>{tp(item.title)}</h1>
          <p>{tp(item.summary)}</p>
          <Link to="/contact" className="tj-button tj-button-lime">{tp('Contact Us')} <ArrowUpRight size={16} /></Link>
        </div>
        <span className="tj-detail-hero-mark"><Icon size={20} /> {tp(category)} / {translatedTitle.toUpperCase()}</span>
      </section>

      <section className="tj-detail-overview tj-section" data-header-theme="light">
        <div>
          <p className="tj-eyebrow"><span /> {tp(type === 'service' ? 'How we can help' : 'Project overview')}</p>
          <h2>{tp(type === 'service' ? 'Practical expertise.' : 'Work built for real conditions.')}</h2>
        </div>
        <div className="tj-detail-description">
          <p>{tp(item.description)}</p>
          <Link to="/contact" className="tj-text-link">{tp('Contact Us')} <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="tj-detail-included" data-header-theme="dark">
        <div className="tj-detail-included-inner tj-section">
          <div>
            <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp(type === 'service' ? 'Services included' : 'Work included')}</p>
            <h2>{tp('The right work. Done properly.')}</h2>
          </div>
          <ul>
            {item.included.map(work => (
              <li key={work}><Check size={17} /> {tp(work)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tj-detail-gallery tj-section" data-header-theme="light">
        <div className="tj-detail-gallery-heading">
          <div>
            <p className="tj-eyebrow"><span /> {tp('On site. In the workshop.')}</p>
            <h2>{tp('Skilled hands. Solid work.')}</h2>
          </div>
          <p>{tp('A closer look at the equipment, environments and workmanship behind our projects.')}</p>
        </div>
        <div className="tj-detail-gallery-grid">
          {item.images.map((image, index) => (
            <figure key={image}>
              <img src={image} alt={`${tp(item.title)} — ${index + 1}`} loading="lazy" />
              <figcaption><span>0{index + 1}</span> / {tp(item.title)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="tj-detail-cta" data-header-theme="dark">
        <div>
          <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Have a job in mind?')}</p>
          <h2>{tp('Let’s talk about your project.')}</h2>
          <p>{tp('Tell us what you need and we’ll discuss the right way to get the work done.')}</p>
        </div>
        <Link to="/contact" className="tj-button tj-button-lime">{tp('Contact Us')} <ArrowUpRight size={16} /></Link>
      </section>
    </>
  );
}
