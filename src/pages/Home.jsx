import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
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
  X,
} from 'lucide-react';
import PublicSiteFooter from '../components/layout/PublicSiteFooter';
import PublicSiteHeader from '../components/layout/PublicSiteHeader';
import PublicImageViewer from '../components/layout/PublicImageViewer';
import { landingMedia } from '../config/landingMedia';
import { useLanguage } from '../context/LanguageContext';
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
  { title: 'Welding inspection', alt: 'Tjädertuppen welder inspecting a finished weld', image: landingMedia.gallery[0] },
  { title: 'Field service vehicle', alt: 'Tjädertuppen worker beside the branded field service pickup', image: landingMedia.gallery[1] },
  { title: 'Our team', alt: 'Tjädertuppen team working on a steel installation', image: landingMedia.gallery[2] },
  { title: 'On-site repairs', alt: 'Tjädertuppen worker repairing a trailer on site', image: landingMedia.gallery[3] },
  { title: 'Steel installation', alt: 'Worker installing steel framework above an industrial site', image: landingMedia.gallery[4] },
  { title: 'Work in the field', alt: 'Tjädertuppen worker overlooking an active construction site', image: landingMedia.gallery[5] },
];

const expertise = [
  'Professional Welding',
  'Industrial Fabrication',
  'Mobile Field Service',
  'Maintenance & Repairs',
  'Steel & Metalwork',
  'Safety & Quality',
  'Service Across Sweden',
];

const heroHeadlines = [
  { firstLine: 'Precision in', secondLine: 'Every', emphasis: 'Weld.' },
  { firstLine: 'Strength in', secondLine: 'Every', emphasis: 'Structure.' },
  { firstLine: 'Built for', secondLine: 'Every', emphasis: 'Challenge.' },
  { firstLine: 'Quality in', secondLine: 'Every', emphasis: 'Detail.' },
];

function getHeroHeadlineIndex() {
  const storageKey = 'tj_home_hero_headline';

  try {
    const storedIndex = sessionStorage.getItem(storageKey);
    const previousIndex = storedIndex === null ? -1 : Number(storedIndex);
    const availableIndexes = heroHeadlines
      .map((_, index) => index)
      .filter(index => index !== previousIndex);
    const selectedIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    sessionStorage.setItem(storageKey, String(selectedIndex));
    return selectedIndex;
  } catch {
    return Math.floor(Math.random() * heroHeadlines.length);
  }
}

export default function Home() {
  const { tp } = useLanguage();
  const weldingVideoRef = useRef(null);
  const serviceImageDialogRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [heroHeadlineIndex, setHeroHeadlineIndex] = useState(getHeroHeadlineIndex);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(null);
  const heroHeadline = heroHeadlines[heroHeadlineIndex];

  useEffect(() => {
    const dialog = serviceImageDialogRef.current;
    if (!dialog) return;

    if (selectedServiceIndex !== null && !dialog.open) {
      dialog.showModal();
    } else if (selectedServiceIndex === null && dialog.open) {
      dialog.close();
    }

    if (selectedServiceIndex === null) return;

    const handleGalleryKeys = event => {
      if (event.key === 'ArrowRight') {
        setSelectedServiceIndex(index => (index + 1) % services.length);
      } else if (event.key === 'ArrowLeft') {
        setSelectedServiceIndex(index => (index - 1 + services.length) % services.length);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
        setSelectedServiceIndex(null);
      }
    };

    window.addEventListener('keydown', handleGalleryKeys);
    return () => window.removeEventListener('keydown', handleGalleryKeys);
  }, [selectedServiceIndex]);

  useEffect(() => {
    const headlineInterval = window.setInterval(() => {
      setHeroHeadlineIndex(currentIndex => {
        const availableIndexes = heroHeadlines
          .map((_, index) => index)
          .filter(index => index !== currentIndex);
        const selectedIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

        try {
          sessionStorage.setItem('tj_home_hero_headline', String(selectedIndex));
        } catch {
          // Storage is optional; rotation continues for this page view.
        }

        return selectedIndex;
      });
    }, 4500);

    return () => window.clearInterval(headlineInterval);
  }, []);

  useEffect(() => {
    const slideInterval = window.setInterval(() => {
      setHeroSlideIndex(index => (index + 1) % landingMedia.heroBanners.length);
    }, 6000);

    return () => window.clearInterval(slideInterval);
  }, []);

  const toggleVideo = async () => {
    const video = weldingVideoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setVideoError('');
      } catch {
        setVideoError(tp('The video could not be played. Please try again.'));
      }
    } else {
      video.pause();
    }
  };

  return (
    <main className="tj-landing">
      <PublicSiteHeader variant="hero" />
      <section className="tj-hero" id="home" data-header-theme="dark">
        <div
          className="tj-hero-slides"
          aria-hidden="true"
          style={{
            width: `${landingMedia.heroBanners.length * 100}%`,
            transform: `translateX(-${(heroSlideIndex * 100) / landingMedia.heroBanners.length}%)`,
          }}
        >
          {landingMedia.heroBanners.map((image, index) => (
            <div
              className="tj-hero-slide"
              key={image}
              style={{ flexBasis: `${100 / landingMedia.heroBanners.length}%` }}
            >
              <img
                src={image}
                alt=""
                loading="eager"
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>
        <div className="tj-hero-shade" />

        <div className="tj-hero-content">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Swedish welding & industrial services')}</p>
          <h1 key={heroHeadlineIndex} className="tj-hero-headline">{tp(heroHeadline.firstLine)}<br />{tp(heroHeadline.secondLine)} <em>{tp(heroHeadline.emphasis)}</em></h1>
          <p className="tj-hero-lede">
            {tp('Professional welding, fabrication and industrial services across Sweden.')}
          </p>
          <div className="tj-hero-actions">
            <a href="#contact" className="tj-button tj-button-lime">{tp('Get in Touch')} <ArrowUpRight size={17} /></a>
            <a href="#services" className="tj-button tj-button-outline">{tp('Our Services')} <ArrowDown size={16} /></a>
          </div>
        </div>
        <a className="tj-scroll-cue" href="#about" aria-label={tp('Scroll to discover Tjädertuppen')}>
          <span>{tp('Crafted for the real world')}</span><ArrowDown size={15} />
        </a>
        <div className="tj-hero-coordinate"><span>{tp('SWEDEN')}</span><i /> {tp('WELDING · FABRICATION · FIELD SERVICE')}</div>
      </section>

      <div className="tj-expertise-banner" aria-label={tp('Our expertise')} data-header-theme="light">
        <div className="tj-expertise-track">
          {[0, 1].map(copy => (
            <div className="tj-expertise-group" key={copy} aria-hidden={copy === 1}>
              {expertise.map(item => <span className="tj-expertise-item" key={item}>{tp(item)}</span>)}
            </div>
          ))}
        </div>
      </div>

      <section className="tj-about tj-section" id="about" data-header-theme="light">
        <div className="tj-about-copy">
          <p className="tj-eyebrow"><span /> {tp('Tjädertuppen Svets & Konsult')}</p>
          <h2>{tp('Built to work.')}<br />{tp('Built to')} <em>{tp('last.')}</em></h2>
          <p className="tj-about-lede">
            {tp('We bring skilled workmanship and practical thinking to welding, fabrication and industrial service.')}
          </p>
          <p className="tj-about-body">
            {tp('From a repair on site to a custom-built solution, we take responsibility for the details and deliver work you can depend on. Swedish quality, a reliable partner and a hands-on approach — wherever the work needs doing.')}
          </p>
          <a className="tj-text-link" href="#services">{tp('What we do')} <ArrowRight size={17} /></a>
          <ul className="tj-about-values">
            <li><Check size={15} /> {tp('Skilled workmanship')}</li>
            <li><Check size={15} /> {tp('Reliable delivery')}</li>
            <li><Check size={15} /> {tp('Safety in every step')}</li>
          </ul>
        </div>
        <figure className="tj-about-photo">
          <img src={landingMedia.company.worker} alt={tp("Tjädertuppen worker wearing the company's branded high-visibility jacket")} />
          <figcaption><span>{tp('Our people. Our standard.')}</span><span>01 / {tp('SWEDEN')}</span></figcaption>
        </figure>
      </section>

      <section className="tj-services tj-section" id="services" data-header-theme="light">
        <div className="tj-section-heading">
          <div>
            <p className="tj-eyebrow"><span /> {tp('What we do')}</p>
            <h2>{tp('Made for demanding')}<br /><em>{tp('industrial work.')}</em></h2>
          </div>
          <p>{tp('From precise welding to dependable field support, we bring skilled hands and practical experience to every job.')}</p>
        </div>
        <div className="tj-service-grid">
          {services.map(({ number, title, text, icon: Icon }, index) => (
            <article className="tj-service" key={number}>
              <button
                className="tj-service-image"
                type="button"
                style={{ '--service-photo': `url("${landingMedia.services[index]}")` }}
                onClick={() => setSelectedServiceIndex(index)}
                aria-label={tp(`View ${title} image`)}
              >
                <img src={landingMedia.services[index]} alt="" loading="lazy" />
                <span className="tj-service-icon"><Icon size={20} strokeWidth={1.6} /></span>
              </button>
              <div className="tj-service-copy">
                <span className="tj-service-number">{number}</span>
                <h3>{tp(title)}</h3>
                <p>{tp(text)}</p>
                <a href="#contact" aria-label={tp(`Enquire about ${title}`)}><ArrowUpRight size={18} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>
      {selectedServiceIndex !== null && (
        <dialog
          className="tj-service-lightbox"
          ref={serviceImageDialogRef}
          aria-label={tp('Service image gallery')}
          onClose={() => setSelectedServiceIndex(null)}
          onCancel={() => setSelectedServiceIndex(null)}
          onClick={event => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
        >
          <div className="tj-service-lightbox-content">
            <div
              className="tj-service-lightbox-stage"
              style={{ '--service-photo': `url("${landingMedia.services[selectedServiceIndex]}")` }}
            >
              <div className="tj-service-lightbox-topline">
                <span>{tp('Tjädertuppen · Service gallery')}</span>
                <span>{String(selectedServiceIndex + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}</span>
              </div>
              <img
                src={landingMedia.services[selectedServiceIndex]}
                alt={tp(`${services[selectedServiceIndex].title} service`)}
              />
              <button
                className="tj-service-lightbox-arrow is-previous"
                type="button"
                onClick={() => setSelectedServiceIndex(index => (index - 1 + services.length) % services.length)}
                aria-label={tp('Previous service image')}
              >
                <ArrowLeft size={19} />
              </button>
              <button
                className="tj-service-lightbox-arrow is-next"
                type="button"
                onClick={() => setSelectedServiceIndex(index => (index + 1) % services.length)}
                aria-label={tp('Next service image')}
              >
                <ArrowRight size={19} />
              </button>
            </div>
            <aside className="tj-service-lightbox-details">
              <button
                className="tj-service-lightbox-close"
                type="button"
                onClick={() => serviceImageDialogRef.current?.close()}
                aria-label={tp('Close image gallery')}
              >
                <X size={19} />
              </button>
              <p className="tj-service-lightbox-eyebrow">{tp('What we do')} <span /> {services[selectedServiceIndex].number}</p>
              <h2>{tp(services[selectedServiceIndex].title)}</h2>
              <p className="tj-service-lightbox-description">{tp(services[selectedServiceIndex].text)}</p>
              <div className="tj-service-lightbox-progress" aria-hidden="true">
                <span style={{ width: `${((selectedServiceIndex + 1) / services.length) * 100}%` }} />
              </div>
              <p className="tj-service-lightbox-hint">{tp('Explore our services')}</p>
              <div className="tj-service-lightbox-thumbnails" aria-label={tp('Choose a service image')}>
                {services.map((service, index) => (
                  <button
                    className={`tj-service-lightbox-thumbnail${index === selectedServiceIndex ? ' is-active' : ''}`}
                    type="button"
                    key={service.number}
                    onClick={() => setSelectedServiceIndex(index)}
                    aria-label={tp(`Show ${service.title} image`)}
                    aria-current={index === selectedServiceIndex ? 'true' : undefined}
                  >
                    <img src={landingMedia.services[index]} alt="" />
                    <span>{tp(service.title)}</span>
                  </button>
                ))}
              </div>
              <p className="tj-service-lightbox-key-hint">{tp('Use ← → to browse')}</p>
            </aside>
          </div>
        </dialog>
      )}

      <section className="tj-company-showcase" id="projects" data-header-theme="dark">
        <div className="tj-company-showcase-heading">
          <div>
            <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Work in the real world')}</p>
            <h2>{tp('Good work.')}<br /><em>{tp('Built to last.')}</em></h2>
          </div>
          <p className="tj-company-showcase-intro">{tp('A closer look at the people, equipment and craftsmanship behind every job.')}</p>
        </div>
        <div className="tj-company-gallery">
          {companyGallery.map((item, index) => (
            <figure className={`tj-company-image ${item.kind}`} key={item.title}>
              <img src={item.image} alt={tp(item.title)} className={`fit-${item.fit}`} loading="lazy" />
              <figcaption><span>0{index + 1}</span>{tp(item.title)}<ArrowUpRight size={15} /></figcaption>
            </figure>
          ))}
        </div>
        <p className="tj-company-showcase-caption">{tp('A trusted pair of hands — wherever the work takes us.')}</p>
      </section>

      <section className="tj-process" data-header-theme="dark">
        <div className="tj-process-inner tj-section">
          <div className="tj-process-heading">
            <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Straightforward from start to finish')}</p>
            <h2>{tp('Good work starts')}<br />{tp('with a clear plan.')}</h2>
            <p>{tp('One experienced partner, from the first conversation through to the finished job.')}</p>
          </div>
          <div className="tj-process-list">
            {process.map(step => (
              <article className="tj-process-step" key={step.number}>
                <span>{step.number}</span>
                <div><h3>{tp(step.title)}</h3><p>{tp(step.text)}</p></div>
                <ChevronRight size={17} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tj-why tj-section" data-header-theme="light">
        <div className="tj-why-photo">
          <img src={landingMedia.company.vehicle} alt={tp('Tjädertuppen branded service vehicle')} loading="lazy" />
          <span className="tj-photo-label"><Truck size={15} /> {tp('Ready when the work calls')}</span>
        </div>
        <div className="tj-why-copy">
          <p className="tj-eyebrow"><span /> {tp('Why Tjädertuppen')}</p>
          <h2>{tp('Experience you can')}<br /><em>{tp('put to work.')}</em></h2>
          <p className="tj-why-lede">{tp('Dependable people. Practical solutions. Quality you can see in the finished work.')}</p>
          <ul className="tj-why-list">
            <li><ShieldCheck size={17} /><span><strong>{tp('Professional workmanship')}</strong><small>{tp('Care taken at every stage, down to the last detail.')}</small></span></li>
            <li><Wrench size={17} /><span><strong>{tp('Industrial expertise')}</strong><small>{tp('Hands-on experience in demanding working environments.')}</small></span></li>
            <li><Truck size={17} /><span><strong>{tp('Flexible field service')}</strong><small>{tp('On-site support where your operation needs it.')}</small></span></li>
            <li><Check size={17} /><span><strong>{tp('Safety and quality first')}</strong><small>{tp('Work planned carefully and delivered responsibly.')}</small></span></li>
          </ul>
        </div>
      </section>

      <section className="tj-video-section" data-header-theme="dark">
        <div className="tj-video-heading">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Skill. Steel. Standards.')}</p>
          <h2>{tp('Where skill meets')} <em>{tp('steel.')}</em></h2>
          <p>{tp('Professional craftsmanship for demanding industrial environments.')}</p>
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
            aria-label={tp(videoPlaying ? 'Pause welding video' : 'Play welding video')}
          >
            {videoPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
          </button>
          {videoError && <p className="tj-video-error" role="alert">{videoError}</p>}
          <div className="tj-video-caption"><span /> {tp('PRECISION IN EVERY WELD')} <span>SVETS &amp; KONSULT</span></div>
        </div>
      </section>

      <section className="tj-stats" aria-label={tp('Tjädertuppen at a glance')} data-header-theme="dark">
        <div className="tj-stat-intro"><p className="tj-eyebrow tj-eyebrow-light"><span /> {tp('Ready for the next job')}</p><h2>{tp('Work you')}<br /><em>{tp('can count on.')}</em></h2></div>
        <div className="tj-stat"><strong>10<span>+</span></strong><p>{tp('Years of experience')}</p></div>
        <div className="tj-stat"><strong>100<span>+</span></strong><p>{tp('Completed projects')}</p></div>
        <div className="tj-stat"><strong>24<span>/7</span></strong><p>{tp('Field service')}</p></div>
        <div className="tj-stat"><strong>100<span>%</span></strong><p>{tp('Commitment to quality')}</p></div>
      </section>

      <section className="tj-gallery tj-section" data-header-theme="light">
        <div className="tj-section-heading tj-gallery-heading">
          <div><p className="tj-eyebrow"><span /> {tp('Work in the real world')}</p><h2>{tp('Good work.')}<br /><em>{tp('Built to last.')}</em></h2></div>
          <p>{tp('A look at the people, equipment and industrial settings behind Tjädertuppen.')}</p>
        </div>
        <div className="tj-gallery-grid">
          {gallery.map((item, index) => (
            <figure className={`tj-gallery-item tj-gallery-item-${index + 1}`} key={item.title}>
              <img src={item.image} alt={tp(item.alt)} loading="lazy" />
              <figcaption><span>0{index + 1}</span>{tp(item.title)}<ArrowUpRight size={16} /></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="tj-sweden" data-header-theme="dark">
        <div className="tj-sweden-mark" aria-hidden="true"><span /><i /></div>
        <div className="tj-sweden-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><MapPin size={14} /> {tp('Proudly working across Sweden')}</p>
          <h2>{tp('Industrial craftsmanship')}<br />{tp('in Sweden.')}</h2>
          <p>{tp('Based in Sweden and ready to bring skilled welding and industrial service to your site.')}</p>
        </div>
        <span className="tj-sweden-coordinate">{tp('SWEDISH QUALITY · WHEREVER YOU NEED US')}</span>
      </section>

      <section className="tj-cta" id="contact" data-header-theme="dark">
        <div className="tj-cta-copy">
          <p className="tj-eyebrow tj-eyebrow-light"><span /> {tp("Let's get to work")}</p>
          <h2>{tp('Have a project')}<br />{tp('in mind?')}</h2>
          <p>{tp("Let's discuss your welding, fabrication or industrial service requirements.")}</p>
        </div>
        <div className="tj-cta-contact">
          <a href="tel:+46702862773" className="tj-button tj-button-lime">{tp('Contact TJÄDERTUPPEN')} <ArrowUpRight size={17} /></a>
          <a href="tel:+46702862773" className="tj-direct-contact"><Phone size={16} /><span>{tp('Call us directly')}<small>+46 70 286 27 73</small></span></a>
        </div>
      </section>

      <PublicSiteFooter />
      <PublicImageViewer />
    </main>
  );
}
