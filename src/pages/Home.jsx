import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Cog,
  Factory,
  Flame,
  Hammer,
  MapPin,
  Pause,
  Phone,
  Play,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import PublicSiteFooter from '../components/layout/PublicSiteFooter';
import PublicSiteHeader from '../components/layout/PublicSiteHeader';
import { landingMedia } from '../config/landingMedia';
import './Home.css';

const services = [
  {
    number: '01',
    title: 'Welding',
    text: 'Professional welding and repair work for industrial equipment and structures.',
    icon: Flame,
  },
  {
    number: '02',
    title: 'Industrial Fabrication',
    text: 'Custom-built components, assemblies and metalwork, made for the job.',
    icon: Factory,
  },
  {
    number: '03',
    title: 'Field Service',
    text: 'Responsive on-site welding and technical service wherever work takes us.',
    icon: Truck,
  },
  {
    number: '04',
    title: 'Maintenance & Repairs',
    text: 'Practical maintenance, repair and modification to keep equipment working.',
    icon: Wrench,
  },
  {
    number: '05',
    title: 'Steel & Metalwork',
    text: 'Carefully executed steelwork and metal fabrication for demanding environments.',
    icon: Hammer,
  },
  {
    number: '06',
    title: 'Custom Solutions',
    text: 'A flexible, hands-on approach shaped around your technical requirements.',
    icon: Cog,
  },
];

const process = [
  { number: '01', title: 'Consultation', text: "We listen, visit the site if needed, and get to know the job." },
  { number: '02', title: 'Planning', text: 'We agree on materials, timing and a safe way to get it done.' },
  { number: '03', title: 'Fabrication', text: 'Skilled welding and fabrication, carried out with care.' },
  { number: '04', title: 'Delivery', text: 'We finish reliably, check the details and hand over the work.' },
];

const companyGallery = [
  { image: landingMedia.company.welding, title: 'Industrial Welding', kind: 'tj-gallery-weld', fit: 'cover' },
  { image: landingMedia.company.vehicle, title: 'Field Service', kind: 'tj-gallery-vehicle', fit: 'contain' },
  { image: landingMedia.company.worker, title: 'Built in Sweden', kind: 'tj-gallery-worker', fit: 'cover' },
];

const gallery = [
  { title: 'Welding', alt: 'TJÄDERTUPPEN welder producing sparks while fabricating steel', image: landingMedia.gallery[0] },
  { title: 'Field service vehicle', alt: 'TJÄDERTUPPEN work pickup on an industrial site', image: landingMedia.gallery[1] },
  { title: 'Our team', alt: 'Two TJÄDERTUPPEN workers at an industrial construction site', image: landingMedia.gallery[2] },
  { title: 'On-site repairs', alt: 'TJÄDERTUPPEN worker repairing equipment at a customer site', image: landingMedia.gallery[3] },
  { title: 'Steel installation', alt: 'Structural steel installation by an industrial work crew', image: landingMedia.gallery[4] },
  { title: 'Work in the field', alt: 'TJÄDERTUPPEN field service vehicle and site work in Sweden', image: landingMedia.gallery[5] },
];

export default function Home() {
  const weldingVideoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState('');

  const toggleVideo = async () => {
    const video = weldingVideoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setVideoError('');
      } catch {
        setVideoError('The video could not be played. Please try again.');
      }
    } else {
      video.pause();
    }
  };

  return (
    <main className="tj-landing">
      <section className="tj-hero" id="home">
        <video className="tj-hero-video" autoPlay muted loop playsInline poster={landingMedia.heroPoster} aria-hidden="true">
          <source src={landingMedia.heroVideo} type="video/mp4" />
        </video>
        <div className="tj-hero-shade" />
        <PublicSiteHeader variant="hero" />

        <div className="tj-hero-content">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> Swedish welding &amp; industrial services</p>
          <h1>Precision in<br />Every <em>Weld.</em></h1>
          <p className="tj-hero-lede">
            Professional welding, fabrication and industrial services across Sweden.
          </p>
          <div className="tj-hero-actions">
            <a href="#contact" className="tj-button tj-button-lime">Get in Touch <ArrowUpRight size={17} /></a>
            <a href="#services" className="tj-button tj-button-outline">Our Services <ArrowDown size={16} /></a>
          </div>
        </div>
        <a className="tj-scroll-cue" href="#about" aria-label="Scroll to discover Tjädertuppen">
          <span>Crafted for the real world</span><ArrowDown size={15} />
        </a>
        <div className="tj-hero-coordinate"><span>SWEDEN</span><i /> WELDING · FABRICATION · FIELD SERVICE</div>
      </section>

      <section className="tj-about tj-section" id="about">
        <div className="tj-about-copy">
          <p className="tj-eyebrow"><span /> Tjädertuppen Svets &amp; Konsult</p>
          <h2>Built to work.<br />Built to <em>last.</em></h2>
          <p className="tj-about-lede">
            We bring skilled workmanship and practical thinking to welding, fabrication
            and industrial service.
          </p>
          <p className="tj-about-body">
            From a repair on site to a custom-built solution, we take responsibility for
            the details and deliver work you can depend on. Swedish quality, a reliable
            partner and a hands-on approach — wherever the work needs doing.
          </p>
          <a className="tj-text-link" href="#services">What we do <ArrowRight size={17} /></a>
          <ul className="tj-about-values">
            <li><Check size={15} /> Skilled workmanship</li>
            <li><Check size={15} /> Reliable delivery</li>
            <li><Check size={15} /> Safety in every step</li>
          </ul>
        </div>
        <figure className="tj-about-photo">
          <img src={landingMedia.company.worker} alt="TJÄDERTUPPEN worker wearing the company's high-visibility jacket" />
          <figcaption><span>Our people. Our standard.</span><span>01 / SWEDEN</span></figcaption>
        </figure>
      </section>

      <section className="tj-services tj-section" id="services">
        <div className="tj-section-heading">
          <div>
            <p className="tj-eyebrow"><span /> What we do</p>
            <h2>Made for demanding<br /><em>industrial work.</em></h2>
          </div>
          <p>From precise welding to dependable field support, we bring skilled hands and practical experience to every job.</p>
        </div>
        <div className="tj-service-grid">
          {services.map(({ number, title, text, icon: Icon }, index) => (
            <article className="tj-service" key={number}>
              <div className="tj-service-image">
                <img src={landingMedia.services[index]} alt="" loading="lazy" />
                <span className="tj-service-icon"><Icon size={20} strokeWidth={1.6} /></span>
              </div>
              <div className="tj-service-copy">
                <span className="tj-service-number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#contact" aria-label={`Enquire about ${title}`}><ArrowUpRight size={18} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tj-company-showcase" id="projects">
        <div className="tj-company-showcase-heading">
          <div>
            <p className="tj-eyebrow tj-eyebrow-light"><span /> Work in the real world</p>
            <h2>Good work.<br /><em>Built to last.</em></h2>
          </div>
          <p className="tj-company-showcase-intro">A closer look at the people, equipment and craftsmanship behind every job.</p>
        </div>
        <div className="tj-company-gallery">
          {companyGallery.map((item, index) => (
            <figure className={`tj-company-image ${item.kind}`} key={item.title}>
              <img src={item.image} alt={item.title} className={`fit-${item.fit}`} loading="lazy" />
              <figcaption><span>0{index + 1}</span>{item.title}<ArrowUpRight size={15} /></figcaption>
            </figure>
          ))}
        </div>
        <p className="tj-company-showcase-caption">A trusted pair of hands — wherever the work takes us.</p>
      </section>

      <section className="tj-process">
        <div className="tj-process-inner tj-section">
          <div className="tj-process-heading">
            <p className="tj-eyebrow tj-eyebrow-light"><span /> Straightforward from start to finish</p>
            <h2>Good work starts<br />with <em>a clear plan.</em></h2>
            <p>One experienced partner, from the first conversation through to the finished job.</p>
          </div>
          <div className="tj-process-list">
            {process.map(step => (
              <article className="tj-process-step" key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.text}</p></div>
                <ChevronRight size={17} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tj-why tj-section">
        <div className="tj-why-photo">
          <img src={landingMedia.company.vehicle} alt="TJÄDERTUPPEN branded service vehicle ready for field work" loading="lazy" />
          <span className="tj-photo-label"><Truck size={15} /> Ready when the work calls</span>
        </div>
        <div className="tj-why-copy">
          <p className="tj-eyebrow"><span /> Why Tjädertuppen</p>
          <h2>Experience you can<br /><em>put to work.</em></h2>
          <p className="tj-why-lede">Dependable people. Practical solutions. Quality you can see in the finished work.</p>
          <ul className="tj-why-list">
            <li><ShieldCheck size={17} /><span><strong>Professional workmanship</strong><small>Care taken at every stage, down to the last detail.</small></span></li>
            <li><Wrench size={17} /><span><strong>Industrial expertise</strong><small>Hands-on experience in demanding working environments.</small></span></li>
            <li><Truck size={17} /><span><strong>Flexible field service</strong><small>On-site support where your operation needs it.</small></span></li>
            <li><Check size={17} /><span><strong>Safety and quality first</strong><small>Work planned carefully and delivered responsibly.</small></span></li>
          </ul>
        </div>
      </section>

      <section className="tj-video-section">
        <div className="tj-video-heading">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> Skill. Steel. Standards.</p>
          <h2>Where skill meets <em>steel.</em></h2>
          <p>Professional craftsmanship for demanding industrial environments.</p>
        </div>
        <div className="tj-video-frame">
          <video
            ref={weldingVideoRef}
            poster={landingMedia.weldingVideoPoster}
            playsInline
            controls={videoPlaying}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
          >
            <source src={landingMedia.heroVideo} type="video/mp4" />
          </video>
          <button
            className={`tj-video-play${videoPlaying ? ' is-playing' : ''}`}
            type="button"
            onClick={toggleVideo}
            aria-label={videoPlaying ? 'Pause welding video' : 'Play welding video'}
          >
            {videoPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
          </button>
          {videoError && <p className="tj-video-error" role="alert">{videoError}</p>}
          <div className="tj-video-caption"><span /> PRECISION IN EVERY WELD <span>SVETS &amp; KONSULT</span></div>
        </div>
      </section>

      <section className="tj-stats" aria-label="Tjädertuppen at a glance">
        <div className="tj-stat-intro"><p className="tj-eyebrow tj-eyebrow-light"><span /> Ready for the next job</p><h2>Work you<br /><em>can count on.</em></h2></div>
        <div className="tj-stat"><strong>10<span>+</span></strong><p>Years of experience</p></div>
        <div className="tj-stat"><strong>100<span>+</span></strong><p>Completed projects</p></div>
        <div className="tj-stat"><strong>24<span>/7</span></strong><p>Field service</p></div>
        <div className="tj-stat"><strong>100<span>%</span></strong><p>Commitment to quality</p></div>
      </section>

      <section className="tj-gallery tj-section">
        <div className="tj-section-heading tj-gallery-heading">
          <div><p className="tj-eyebrow"><span /> Work in the real world</p><h2>Good work.<br /><em>Built to last.</em></h2></div>
          <p>A look at the people, equipment and industrial settings behind Tjädertuppen.</p>
        </div>
        <div className="tj-gallery-grid">
          {gallery.map((item, index) => (
            <figure className={`tj-gallery-item tj-gallery-item-${index + 1}`} key={item.title}>
              <img src={item.image} alt={item.alt} loading="lazy" />
              <figcaption><span>0{index + 1}</span>{item.title}<ArrowUpRight size={16} /></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="tj-sweden">
        <div className="tj-sweden-mark" aria-hidden="true"><span /><i /></div>
        <div className="tj-sweden-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><MapPin size={14} /> Proudly working across Sweden</p>
          <h2>Industrial craftsmanship<br />in <em>Sweden.</em></h2>
          <p>Based in Sweden and ready to bring skilled welding and industrial service to your site.</p>
        </div>
        <span className="tj-sweden-coordinate">SWEDISH QUALITY · WHEREVER YOU NEED US</span>
      </section>

      <section className="tj-cta" id="contact">
        <div className="tj-cta-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> Let's get to work</p>
          <h2>Have a project<br />in <em>mind?</em></h2>
          <p>Let's discuss your welding, fabrication or industrial service requirements.</p>
        </div>
        <div className="tj-cta-contact">
          <a href="tel:+46702862773" className="tj-button tj-button-lime">Contact TJÄDERTUPPEN <ArrowUpRight size={17} /></a>
          <a href="tel:+46702862773" className="tj-direct-contact"><Phone size={16} /><span>Call us directly<small>+46 70 286 27 73</small></span></a>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
