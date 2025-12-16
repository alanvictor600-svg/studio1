"use client";

// src/app/page.tsx
import { Header } from '@/components/landing/header';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
