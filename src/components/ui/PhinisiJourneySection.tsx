import { AnimatedFeatureCard } from "./animated-feature-card";

const steps = [
  {
    index: "01",
    tag: "KONSEP FUNDAMENTAL",
    title: "Pahami Konsep Materi",
    description: "Pelajari fundamental melalui materi yang terstruktur, relevan, dan mudah dipahami tanpa kebingungan.",
    imageSrc: "/assets/milestone-concept.png",
    color: "cyan" as const,
  },
  {
    index: "02",
    tag: "LAB PRAKTIK LANGSUNG",
    title: "Terapkan Directly di Lab",
    description: "Praktikkan command, konfigurasi, troubleshooting, dan workflow nyata menggunakan tools industri.",
    imageSrc: "/assets/milestone-practice.png",
    color: "blue" as const,
  },
  {
    index: "03",
    tag: "STUDI KASUS NYATA",
    title: "Bangun Project Portofolio",
    description: "Selesaikan studi kasus dan project arsitektur enterprise nyata yang siap dipamerkan sebagai portofolio.",
    imageSrc: "/assets/milestone-project.png",
    color: "orange" as const,
  },
  {
    index: "04",
    tag: "EVALUASI & CHALLENGE",
    title: "Validasi Kemampuanmu",
    description: "Ukur tingkat pemahaman melalui quiz interaktif, challenge troubleshooting, dan evaluasi ketuntasan project.",
    imageSrc: "/assets/milestone-validation.png",
    color: "emerald" as const,
  },
];

export function PhinisiJourneySection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <AnimatedFeatureCard
            key={step.index}
            index={step.index}
            tag={step.tag}
            title={step.title}
            description={step.description}
            imageSrc={step.imageSrc}
            color={step.color}
          />
        ))}
      </div>
    </div>
  );
}
