import { Server, Terminal, FolderCheck, Compass } from "lucide-react";

const features = [
  {
    icon: Server,
    iconColor: "text-cyan-400",
    title: "Materi langsung praktik industri",
    description: "Fokus pada studi kasus nyata, konfigurasi perangkat, dan troubleshooting lapangan—tanpa teori yang berbelit-belit.",
  },
  {
    icon: Terminal,
    iconColor: "text-sky-400",
    title: "Simulasi CLI & Hands-on Lab",
    description: "Latihan perintah Cisco IOS, server Linux, dan skrip otomatisasi Python langsung melalui modul interaktif.",
  },
  {
    icon: FolderCheck,
    iconColor: "text-amber-400",
    title: "Proyek akhir untuk portofolio",
    description: "Setiap alur belajar dilengkapi proyek akhir berbasis studi kasus nyata yang bisa kamu tampilkan di portofolio.",
  },
  {
    icon: Compass,
    iconColor: "text-emerald-400",
    title: "Roadmap belajar dari dasar",
    description: "Kurikulum terstruktur secara bertahap dari pemula hingga siap menghadapi kebutuhan industri IT.",
  },
];

export function PhinisiBentoGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {features.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-200 hover:border-cyan-400/40 hover:bg-slate-900/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-300/90 pl-1">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
