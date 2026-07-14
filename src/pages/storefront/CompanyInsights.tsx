import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Play,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

interface ProductLine {
  name: string;
  description: string;
  image: string;
}

const PRODUCT_LINES: ProductLine[] = [
  {
    name: 'Luma*Signs',
    description: 'Custom LED neon signs, free nationwide shipping.',
    image: 'https://img1.wsimg.com/isteam/ip/448778c0-66aa-410c-a0d5-c72ae2640cf7/Neon03.jpg',
  },
  {
    name: 'Luma*H2O™',
    description:
      'Waterproof RGBIC LED system for pools and outdoor spaces, seamless multicolor flowing effects.',
    image: 'https://img1.wsimg.com/isteam/ip/448778c0-66aa-410c-a0d5-c72ae2640cf7/LumaPool.png',
  },
  {
    name: 'Luma*Smart Lighting System',
    description: 'Permanent outdoor LED lighting with app control and millions of color options.',
    image: 'https://img1.wsimg.com/isteam/ip/448778c0-66aa-410c-a0d5-c72ae2640cf7/3-00b9fac.jpg',
  },
];

const INSTALLER_BENEFITS = [
  'Strong installer profit margins',
  'Growing demand for permanent lighting',
  'Simple installation process',
  'Dealer wholesale pricing',
  'Training and technical support',
  'Marketing materials and sales support',
];

const CONTRACTOR_TYPES = [
  'Electricians',
  'Landscape lighting companies',
  'Roofing contractors',
  'Exterior contractors',
  'Home improvement companies',
];

const TYPICAL_APPLICATIONS = [
  'Residential homes',
  'Retail storefronts',
  'Restaurants',
  'Office buildings',
  'Hotels and hospitality properties',
];

interface Showroom {
  city: string;
  address: string;
}

const SHOWROOMS: Showroom[] = [
  { city: 'Farmingdale, N.Y.', address: '906 Conklin Street' },
  { city: 'Williston Park, N.Y.', address: '390 Hillside Ave' },
  { city: 'Lawrence, N.Y.', address: '259 Burnside Ave' },
  { city: 'Yonkers, N.Y.', address: '454 South Broadway' },
];

function mapsHref(showroom: Showroom): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${showroom.address}, ${showroom.city}`,
  )}`;
}

interface VideoItem {
  id: string;
  title: string;
}

const VIDEOS: VideoItem[] = [
  { id: 'E8Ftv3pZRGY', title: 'Custom-Made LED Neon Signs by LumiNation' },
  { id: 'u4v9IVCPsFM', title: 'Multicolor LED Lights for your pool INSTALLED !' },
  { id: 'aTLmG2Soq8I', title: 'My New Favorite Products From LumiNation !' },
  { id: 'GFDUJ924nAc', title: 'A Trip To A Client Jobsite' },
  { id: '_h1lN8ijR_c', title: 'Real Customer Real Experience' },
];

export function CompanyInsights() {
  const { theme } = useTheme();
  const brandName = theme?.brand_name;

  return (
    <div className="flex flex-col">
      <div className="container flex flex-col gap-20 py-12 sm:gap-24 sm:py-16">
        {/* Hero */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr] lg:items-start lg:gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-normal sm:text-5xl">
              LED Lighting Stores &amp; Showrooms
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              We are a leading distributor of high-quality commercial, industrial and residential LED
              lighting fixtures, with a 30,000-square-foot warehouse in New York. Our showroom stores
              conveniently serve builders, contractors, designers, handymen, and business clients in the
              Tri-State area. {brandName ? `${brandName} is` : "We're"} dedicated to providing the latest
              LED lighting solutions tailored to your professional needs, with products that promise
              reliability and excellence.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-md bg-brand p-6 text-brand-foreground sm:p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-foreground/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              Free Consultation
            </span>
            <p className="text-sm leading-relaxed opacity-90">
              Ask about our FREE onsite consultation &amp; delivery services for your next project.
            </p>
          </div>
        </section>

        {/* Featured Product Lines */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Portfolio
            </span>
            <h2 className="font-display text-2xl uppercase leading-none tracking-normal sm:text-3xl">
              Featured Product Lines
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_LINES.map((line) => (
              <div key={line.name} className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
                  <img
                    src={line.image}
                    alt={line.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{line.name}</span>
                  <span className="text-sm text-muted-foreground">{line.description}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Become a Luma Light Installer */}
      <section className="bg-brand text-brand-foreground">
        <div className="container flex flex-col gap-8 py-14 sm:py-16">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
              Partnerships
            </span>
            <h2 className="font-display text-3xl uppercase leading-[0.95] tracking-normal sm:text-4xl">
              Become a Luma Light Installer
            </h2>
            <p className="max-w-2xl text-sm opacity-90 sm:text-base">
              Homeowners and businesses are increasingly turning to permanent LED lighting for its mix of
              vibrant holiday displays and elegant, everyday warm white light. Our Luma Light System
              installs discreetly under eaves and integrates seamlessly with landscape lighting &mdash;
              offering millions of colors and easy app control.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {INSTALLER_BENEFITS.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
                  <span className="opacity-90">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-md bg-brand-foreground/10 p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                Ideal Contractors
              </span>
              <ul className="flex flex-col gap-1.5 text-sm opacity-90">
                {CONTRACTOR_TYPES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 rounded-md bg-brand-foreground/10 p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                Typical Applications
              </span>
              <ul className="flex flex-col gap-1.5 text-sm opacity-90">
                {TYPICAL_APPLICATIONS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            to="/products"
            className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-brand-foreground px-8 text-xs font-semibold uppercase tracking-[0.12em] text-brand transition-opacity hover:opacity-80"
          >
            Get Started
          </Link>
        </div>
      </section>

      <div className="container flex flex-col gap-20 py-12 sm:gap-24 sm:py-16">
        {/* Showroom Locations */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-display text-2xl uppercase leading-none tracking-normal sm:text-3xl">
              Showroom Locations
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWROOMS.map((showroom) => (
              <div key={showroom.city} className="flex flex-col gap-2 border border-border p-4">
                <span className="text-sm font-semibold">{showroom.city}</span>
                <span className="text-sm text-muted-foreground">{showroom.address}</span>
                <a
                  href={mapsHref(showroom)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand underline-offset-4 hover:underline"
                >
                  View Map <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Stay tuned for other locations opening soon!</p>
        </section>
      </div>

      {/* Contact */}
      <section className="bg-muted">
        <div className="container grid grid-cols-1 gap-8 py-12 sm:grid-cols-3 sm:py-14">
          <div className="flex flex-col items-start gap-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Phone / Text
            </span>
            <span className="text-sm font-semibold">516-774-7415</span>
          </div>
          <a href="mailto:LumiNationCorp@gmail.com" className="flex flex-col items-start gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email Support
            </span>
            <span className="text-sm font-semibold underline-offset-4 hover:underline">
              LumiNationCorp@gmail.com
            </span>
          </a>
          <div className="flex flex-col items-start gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Business Hours
            </span>
            <span className="text-sm font-semibold">Daily 9:00 AM &ndash; 5:00 PM</span>
          </div>
        </div>
      </section>

      <div className="container flex flex-col gap-6 py-12 sm:py-16">
        {/* Showcase & Training */}
        <section className="flex flex-col gap-6">
          <h2 className="border-b border-border pb-3 font-display text-2xl uppercase leading-none tracking-normal sm:text-3xl">
            Showcase &amp; Training
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEOS.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group relative block h-full w-full"
            aria-label={`Play video: ${video.title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/10 transition-colors group-hover:bg-foreground/20">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform group-hover:scale-105">
                <Play className="h-6 w-6 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>
      <span className="text-sm font-medium">{video.title}</span>
    </div>
  );
}
