require("dotenv").config();
const mongoose = require("mongoose");
const Article = require("../models/Article");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/teleremate";

const articles = [
  {
    lotNumber: "LOT-001",
    title: "Sofá Chester 3 Cuerpos - Cuero Genuino Negro",
    description:
      "Sofá estilo Chester de tres cuerpos tapizado en cuero genuino color negro. Excelente estado de conservación, sin roturas ni manchas. Patas de madera tornillo. Ideal para living o estudio ejecutivo.",
    category: "Muebles",
    condition: "Muy bueno",
    status: "depot",
    estimatedPrice: 28000,
    featured: true,
    images: [
      {
        filename: "sofa-chester.jpg",
        url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-002",
    title: 'Smart TV Samsung 65" QLED 4K',
    description:
      "Televisor Samsung QLED 65 pulgadas, 4K Ultra HD, modelo QN65Q70B. Control remoto original, soporte de pared y mesa incluidos. Pantalla en perfecto estado, sin píxeles muertos.",
    category: "Electrónica",
    condition: "Excelente",
    status: "upcoming",
    estimatedPrice: 45000,
    featured: true,
    auctionDate: new Date("2026-03-15"),
    images: [
      {
        filename: "samsung-tv.jpg",
        url: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-003",
    title: "Mesa de Comedor Escandinava + 6 Sillas",
    description:
      "Juego de comedor estilo escandinavo en madera de roble. Mesa extensible 160/210cm. Seis sillas tapizadas en tela gris. Diseño moderno, patas cónicas características del estilo.",
    category: "Muebles",
    condition: "Muy bueno",
    status: "depot",
    estimatedPrice: 35000,
    featured: false,
    images: [
      {
        filename: "mesa-comedor.jpg",
        url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-004",
    title: "Máquina Lavadora Whirlpool 11kg",
    description:
      "Lavarropas Whirlpool de carga frontal, 11kg de capacidad. Función a vapor, 12 programas de lavado. Año 2023, poco uso. Funciona perfectamente.",
    category: "Electrodomésticos",
    condition: "Excelente",
    status: "depot",
    estimatedPrice: 22000,
    featured: false,
    images: [
      {
        filename: "lavarropas.jpg",
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-005",
    title: "Cuadro Óleo sobre Tela - Paisaje Costero",
    description:
      "Pintura al óleo sobre tela de artista nacional. Paisaje costero uruguayo, puesta de sol en La Paloma. Dimensiones: 80x120cm. Enmarcado con marco de madera dorado. Firmado y datado 2019.",
    category: "Arte",
    condition: "Excelente",
    status: "upcoming",
    estimatedPrice: 15000,
    featured: true,
    auctionDate: new Date("2026-03-15"),
    images: [
      {
        filename: "cuadro-oleo.jpg",
        url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-006",
    title: "Motocicleta Honda CB500F 2020",
    description:
      "Honda CB500F 2020 en excelente estado. 15.000km recorridos. Service al día. Documentación completa. Color azul metalizado. Ideal para ciudad y ruta.",
    category: "Vehículos",
    condition: "Muy bueno",
    status: "depot",
    estimatedPrice: 120000,
    featured: true,
    images: [
      {
        filename: "moto-honda.jpg",
        url: "/moto-honda.png",
      },
    ],
  },
  {
    lotNumber: "LOT-007",
    title: "Set de Herramientas Stanley 200 Piezas",
    description:
      "Caja de herramientas Stanley completa con 200 piezas. Incluye llaves, destornilladores, alicates, martillos y más. Caja de plástico duro con compartimentos organizadores. Casi sin uso.",
    category: "Herramientas",
    condition: "Excelente",
    status: "depot",
    estimatedPrice: 12000,
    featured: false,
    images: [
      {
        filename: "herramientas.jpg",
        url: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-008",
    title: "Anillo de Brillantes Platino - 1.2ct",
    description:
      "Anillo solitario en platino 950 con brillante natural de 1.2 quilates. Claridad VS1, color G. Certificado GIA incluido. Talla 15. En estuche original.",
    category: "Joyería",
    condition: "Excelente",
    status: "sold",
    estimatedPrice: 85000,
    salePrice: 92000,
    soldAt: new Date("2026-02-10"),
    featured: false,
    images: [
      {
        filename: "anillo-brillantes.jpg",
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-009",
    title: "Heladera Mabe French Door 600L",
    description:
      "Refrigerador Mabe estilo French Door de 600 litros. Dispenser de agua y hielo. Pantalla táctil. Color gris metalizado. Sin Frost. Año 2022.",
    category: "Electrodomésticos",
    condition: "Muy bueno",
    status: "depot",
    estimatedPrice: 38000,
    featured: false,
    images: [
      {
        filename: "heladera.jpg",
        url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-010",
    title: "Biblioteca Ratán - Estilo Colonial",
    description:
      "Biblioteca en ratán estilo colonial con 5 estantes. Dimensiones: 2m alto x 1.2m ancho x 0.35m profundidad. Puertas de vidrio en los dos estantes inferiores. Color siena.",
    category: "Muebles",
    condition: "Bueno",
    status: "depot",
    estimatedPrice: 8500,
    featured: false,
    images: [
      {
        filename: "biblioteca.jpg",
        url: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-011",
    title: 'MacBook Pro 14" M3 Pro - 2024',
    description:
      "Apple MacBook Pro 14 pulgadas con chip M3 Pro, 18GB RAM, 512GB SSD. Color Space Gray. Batería al 98%. Incluye cargador MagSafe y caja original. Garantía Apple activa.",
    category: "Electrónica",
    condition: "Excelente",
    status: "upcoming",
    estimatedPrice: 95000,
    featured: true,
    auctionDate: new Date("2026-03-22"),
    images: [
      {
        filename: "macbook.jpg",
        url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-012",
    title: "Colección de Relojes Vintage (5 piezas)",
    description:
      "Lote de 5 relojes vintage de colección. Incluye: Omega Seamaster 1968, Longines 1972, Tissot 1965, Cyma 1958 y Movado 1955. Todos funcionando, revisados recientemente.",
    category: "Joyería",
    condition: "Bueno",
    status: "sold",
    estimatedPrice: 45000,
    salePrice: 51000,
    soldAt: new Date("2026-01-28"),
    featured: false,
    images: [
      {
        filename: "relojes.jpg",
        url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-013",
    title: "Aire Acondicionado Split Inverter LG 18000 BTU",
    description:
      "Equipo split Inverter LG 18000 BTU frío/calor. Modelo AS-W182CQR1. Incluye unidad interior y exterior. Instalación no incluida. Un año de uso.",
    category: "Electrodomésticos",
    condition: "Muy bueno",
    status: "depot",
    estimatedPrice: 25000,
    featured: false,
    images: [
      {
        filename: "aire-acondicionado.jpg",
        url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-014",
    title: "Escritorio L Ejecutivo - Madera de Cedro",
    description:
      "Escritorio en forma de L fabricado en madera de cedro macizo. Con cajonera con llave integrada (3 cajones). Incluye silla ejecutiva ergonómica en cuero negro.",
    category: "Muebles",
    condition: "Bueno",
    status: "depot",
    estimatedPrice: 18000,
    featured: false,
    images: [
      {
        filename: "escritorio.jpg",
        url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-015",
    title: "Piano Digital Kawai ES920",
    description:
      "Piano digital Kawai ES920 de 88 teclas con acción de martillo graduado. Mecanismo RH III. Incluye soporte, banquito y pedales. Color negro. Ideal para estudiantes avanzados y profesionales.",
    category: "Otros",
    condition: "Excelente",
    status: "upcoming",
    estimatedPrice: 55000,
    featured: true,
    auctionDate: new Date("2026-03-29"),
    images: [
      {
        filename: "piano.jpg",
        url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-016",
    title: "Bicicleta Trek Marlin 5 MTB 2023",
    description:
      'Mountain bike Trek Marlin 5 2023, talle 17" (M). Cuadro de aluminio, suspensión delantera RockShox, 24 velocidades Shimano. Color verde. 800km recorridos.',
    category: "Otros",
    condition: "Muy bueno",
    status: "sold",
    estimatedPrice: 35000,
    salePrice: 33000,
    soldAt: new Date("2026-02-20"),
    featured: false,
    images: [
      {
        filename: "bicicleta.jpg",
        url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-017",
    title: "Set Cocina Industrial - 3 piezas acero inox",
    description:
      "Equipamiento de cocina industrial en acero inoxidable. Incluye: cocina 6 hornallas, horno, y campana extractora. Marca Morelli. Excelente estado.",
    category: "Electrodomésticos",
    condition: "Bueno",
    status: "depot",
    estimatedPrice: 42000,
    featured: false,
    images: [
      {
        filename: "cocina-industrial.jpg",
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-018",
    title: "Escultura Bronce - Figura Femenina Abstracta",
    description:
      "Escultura en bronce fundido de artista nacional. Figura femenina abstracta, 45cm de altura. Base de mármol negro incluida. Pieza única numerada y certificada. Edición limitada #7/25.",
    category: "Arte",
    condition: "Excelente",
    status: "upcoming",
    estimatedPrice: 32000,
    featured: true,
    auctionDate: new Date("2026-03-22"),
    images: [
      {
        filename: "escultura.jpg",
        url: "/escultura-bronce.png",
      },
    ],
  },
  {
    lotNumber: "LOT-019",
    title: "Consola PlayStation 5 + 5 Juegos",
    description:
      "PlayStation 5 edición estándar (lector de discos). Incluye 2 controles DualSense y 5 juegos: Spider-Man 2, God of War Ragnarök, Gran Turismo 7, Horizon Forbidden West y The Last of Us.",
    category: "Electrónica",
    condition: "Muy bueno",
    status: "depot",
    estimatedPrice: 48000,
    featured: false,
    images: [
      {
        filename: "ps5.jpg",
        url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600",
      },
    ],
  },
  {
    lotNumber: "LOT-020",
    title: "Cámara Sony Alpha A7 IV + 3 Lentes",
    description:
      "Kit fotográfico profesional Sony Alpha A7 IV mirrorless 33MP. Kit incluye: lente kit 28-70mm, lente Sony 85mm f/1.8, Tamron 17-28mm f/2.8. 2 baterías, cargador dual y mochila Peak Design.",
    category: "Electrónica",
    condition: "Excelente",
    status: "upcoming",
    estimatedPrice: 110000,
    featured: true,
    auctionDate: new Date("2026-03-29"),
    images: [
      {
        filename: "camara-sony.jpg",
        url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    await Article.deleteMany({});
    console.log("🗑️  Artículos anteriores eliminados");

    const inserted = await Article.insertMany(articles);
    console.log(`✅ ${inserted.length} artículos insertados correctamente`);

    console.log("\n📋 Resumen:");
    const depot = inserted.filter((a) => a.status === "depot").length;
    const upcoming = inserted.filter((a) => a.status === "upcoming").length;
    const sold = inserted.filter((a) => a.status === "sold").length;
    console.log(`   En depósito: ${depot}`);
    console.log(`   Próximo remate: ${upcoming}`);
    console.log(`   Vendidos: ${sold}`);

    await mongoose.disconnect();
    console.log("\n🎉 Seed completado exitosamente!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seed:", err);
    process.exit(1);
  }
}

seed();
