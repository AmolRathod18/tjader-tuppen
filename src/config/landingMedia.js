const companyImage = filename => `/images/company/${encodeURIComponent(filename)}`;
const bannerImage = filename =>
  `/images/${encodeURIComponent('company banner')}/${encodeURIComponent(filename)}`;

const images = {
  brandedWorker: companyImage('Industrial Worker with Branded Pickup.png'),
  cinematicWelding: companyImage('Cinematic Welding at Tjädertuppen Workshop.png'),
  constructionTeam: companyImage('Construction Workers in a Scaffolded Industrial Hall.png'),
  elevatedAssembly: companyImage('Elevated Worksite Assembly Above the Yard.png'),
  industrialWorker: companyImage('High-Visibility Worker at Industrial Plant.png'),
  trailerRepair: companyImage('High-Visibility Worker Repairing Trailer.png'),
  outdoorWelder: companyImage('Outdoor Welder Sparks Against Blue Machinery.png'),
  rainyFieldWork: companyImage('Rainy Construction Yard with Hi-Vis Worker.png'),
  steelFramework: companyImage('Rooftop Construction Worker and Steel Framework.png'),
  workshopSparks: companyImage('Sparks Fly in the Industrial Workshop.png'),
  blueprintPlanning: companyImage('Sunset Blueprint Collaboration at Construction Site.png'),
  weldingInspection: companyImage('Sunset Gamma Welding Inspection.png'),
  steelworkTeam: companyImage('Sunset Steelwork and Welding Team.png'),
  frameworkWelder: companyImage('Sunset Welder Beneath Steel Framework.png'),
  sunsetBuilder: companyImage('Tjädertuppen Byggare i Solnedgången.png'),
  winterIndustrialWorker: companyImage('Winter Industrial Worker at Billerud Plant.png'),
  winterWelding: companyImage('Winter Welding at Tjädertuppen Site.png'),
  craneAtSunset: companyImage('Worker Overlooking Crane at Sunset.png'),
};

export const landingMedia = {
  company: {
    worker: images.industrialWorker,
    vehicle: '/images/company/branded-service-pickup.jpeg',
    welding: images.cinematicWelding,
    contact: images.sunsetBuilder,
  },
  heroVideo:
    'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4',
  weldingVideoPoster: images.outdoorWelder,
  heroBanners: [
    bannerImage('Industrial Worker Welding Amid Sparks.png'),
    bannerImage('Sunset Industrial Branding with Pickup Truck.png'),
    bannerImage('Sunset Steel Yard with High-Visibility Worker.png'),
  ],
  services: [
    images.cinematicWelding,
    images.constructionTeam,
    images.industrialWorker,
    images.trailerRepair,
    images.elevatedAssembly,
    images.blueprintPlanning,
  ],
  gallery: [
    images.weldingInspection,
    images.brandedWorker,
    images.steelworkTeam,
    images.trailerRepair,
    images.steelFramework,
    images.craneAtSunset,
  ],
  projects: [
    images.outdoorWelder,
    images.elevatedAssembly,
    images.trailerRepair,
    images.frameworkWelder,
    images.brandedWorker,
  ],
};
