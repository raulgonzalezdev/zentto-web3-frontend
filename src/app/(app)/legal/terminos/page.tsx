"use client";

import { LegalDoc, type LegalSection } from "@/components/ui/LegalDoc";

const SECTIONS: LegalSection[] = [
  {
    heading: "Objeto y aceptación",
    paragraphs: [
      "Estos Términos y Condiciones regulan el acceso y uso de la plataforma Zentto Web3 (en adelante, “la Plataforma”), una plataforma de finanzas digitales custodial que permite mantener saldos en criptoactivos, realizar transferencias internas, depósitos y retiros on-chain, y operar en un mercado entre usuarios (P2P).",
      "Al registrarte y utilizar la Plataforma aceptas estos Términos en su totalidad. Si no estás de acuerdo con alguna de sus cláusulas, debes abstenerte de usar el servicio.",
    ],
  },
  {
    heading: "Cuenta de usuario",
    paragraphs: [
      "Para usar la Plataforma debes crear una cuenta con datos veraces y mantenerlos actualizados. Eres el único responsable de la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.",
      "La Plataforma puede exigir la verificación de tu identidad (KYC) como condición para habilitar determinadas funciones, incluidos depósitos, retiros y operaciones P2P.",
    ],
  },
  {
    heading: "Custodia de criptoactivos",
    paragraphs: [
      "La Plataforma opera bajo un modelo custodial: los saldos se mantienen en infraestructura gestionada por el operador. Los importes mostrados como “disponible” pueden usarse de inmediato; los importes “retenidos” están bloqueados por operaciones en curso (por ejemplo, un retiro o un escrow P2P).",
      "El usuario reconoce que los criptoactivos son volátiles y que su valor puede variar significativamente. La Plataforma no garantiza rendimiento, revalorización ni convertibilidad a moneda fiduciaria.",
    ],
  },
  {
    heading: "Depósitos y retiros on-chain",
    paragraphs: [
      "Los depósitos se acreditan una vez detectada y confirmada la transacción en la red correspondiente. Enviar activos a una red o token distintos a los indicados puede resultar en la pérdida irreversible de fondos; el usuario asume ese riesgo.",
      "Los retiros requieren autenticación reforzada (2FA) y pueden estar sujetos a límites, revisiones de cumplimiento y tiempos de liquidación. Las direcciones de destino son responsabilidad exclusiva del usuario.",
    ],
  },
  {
    heading: "Mercado P2P",
    paragraphs: [
      "El mercado P2P permite a los usuarios publicar y tomar ofertas de compra y venta de criptoactivos pagaderas en moneda local. Al vender, el cripto del anunciante queda en escrow hasta que confirme la recepción del pago.",
      "La Plataforma actúa como custodio del escrow, pero no es parte de la relación comercial entre comprador y vendedor ni garantiza la solvencia o buena fe de las contrapartes. El vendedor solo debe liberar el cripto tras verificar el pago en su propia cuenta. Los conflictos derivados de operaciones P2P son responsabilidad de las partes.",
    ],
  },
  {
    heading: "Conductas prohibidas",
    paragraphs: [
      "Está prohibido utilizar la Plataforma para actividades ilícitas, incluyendo lavado de dinero, financiamiento del terrorismo, fraude, evasión de sanciones o cualquier operación contraria a la ley aplicable.",
      "La Plataforma puede suspender o cerrar cuentas, retener fondos y reportar a las autoridades competentes ante indicios razonables de uso indebido, conforme a sus obligaciones de cumplimiento.",
    ],
  },
  {
    heading: "Limitación de responsabilidad",
    paragraphs: [
      "La Plataforma se ofrece “tal cual” y “según disponibilidad”. En la máxima medida permitida por la ley, el operador no será responsable por daños indirectos, lucro cesante, pérdida de datos ni por pérdidas derivadas de la volatilidad de los criptoactivos, fallos de redes blockchain de terceros o errores del usuario.",
    ],
  },
  {
    heading: "Modificaciones y ley aplicable",
    paragraphs: [
      "El operador puede modificar estos Términos en cualquier momento. El uso continuado de la Plataforma tras la publicación de los cambios implica su aceptación.",
      "Estos Términos se rigen por la legislación aplicable en la jurisdicción del operador. Cualquier controversia se someterá a los tribunales competentes de dicha jurisdicción.",
    ],
  },
];

export default function TerminosPage() {
  return (
    <LegalDoc
      title="Términos y Condiciones"
      updatedAt="junio de 2026"
      intro="Lee atentamente estos Términos antes de utilizar Zentto Web3. Definen tus derechos y obligaciones como usuario del servicio."
      sections={SECTIONS}
    />
  );
}
