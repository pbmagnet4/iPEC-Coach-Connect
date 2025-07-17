import React from 'react';
import { Hero } from '../components/sections/Hero';
import { FeaturedCoaches } from '../components/sections/FeaturedCoaches';
import { HowItWorks } from '../components/sections/HowItWorks';
import { Benefits } from '../components/sections/Benefits';
import { Testimonials } from '../components/sections/Testimonials';
import { CommunityHighlights } from '../components/sections/CommunityHighlights';
import { Newsletter } from '../components/sections/Newsletter';

export function Home() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <FeaturedCoaches />
      <Benefits />
      <Testimonials />
      <CommunityHighlights />
      <Newsletter />
    </main>
  );
}