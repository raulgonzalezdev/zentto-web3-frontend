"use client";

import { LegalDoc, type LegalSection } from "@/components/ui/LegalDoc";

const SECTIONS: LegalSection[] = [
  {
    heading: "Responsable del tratamiento",
    paragraphs: [
      "El operador de Zentto Web3 es el responsable del tratamiento de los datos personales que recopila a través de la Plataforma. Esta Política explica qué datos tratamos, con qué finalidad, sobre qué base legal y qué derechos te asisten.",
    ],
  },
  {
    heading: "Datos que recopilamos",
    paragraphs: [
      "Datos de identificación y contacto: nombre, correo electrónico, número de teléfono y, cuando corresponda, documento de identidad y nacionalidad aportados durante la verificación KYC.",
      "Datos de uso y operación: saldos, movimientos, depósitos, retiros, órdenes y trades del mercado P2P, así como métodos de pago que registres.",
      "Datos técnicos: dirección IP, identificadores de sesión y registros de seguridad necesarios para proteger la cuenta.",
    ],
  },
  {
    heading: "Finalidades del tratamiento",
    paragraphs: [
      "Prestar el servicio de finanzas digitales custodial, ejecutar tus operaciones y mantener tu cuenta.",
      "Cumplir obligaciones legales y regulatorias, en particular las relativas a la prevención de lavado de dinero y financiamiento del terrorismo, lo que incluye verificación de identidad y screening contra listas de sanciones.",
      "Garantizar la seguridad de la Plataforma, prevenir el fraude y atender solicitudes de soporte.",
    ],
  },
  {
    heading: "Base legal",
    paragraphs: [
      "El tratamiento se fundamenta en la ejecución del contrato que nos vincula contigo, en el cumplimiento de obligaciones legales aplicables y en el interés legítimo del operador en proteger el servicio y prevenir actividades ilícitas.",
    ],
  },
  {
    heading: "Conservación y seguridad",
    paragraphs: [
      "Conservamos tus datos durante el tiempo necesario para prestar el servicio y para cumplir con los plazos legales de conservación aplicables a entidades financieras y de cumplimiento.",
      "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo cifrado en tránsito, autenticación reforzada (2FA) y control de acceso. Ninguna medida es infalible, por lo que no podemos garantizar seguridad absoluta.",
    ],
  },
  {
    heading: "Compartición de datos",
    paragraphs: [
      "No vendemos tus datos personales. Solo los compartimos con proveedores que nos prestan servicios (por ejemplo, verificación de identidad o infraestructura), bajo obligaciones de confidencialidad, y con autoridades competentes cuando exista una obligación legal de hacerlo.",
      "En el mercado P2P, los datos estrictamente necesarios para completar una operación (por ejemplo, los de un método de pago que tú decidas compartir) podrán ser visibles para tu contraparte.",
    ],
  },
  {
    heading: "Tus derechos",
    paragraphs: [
      "Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad sobre tus datos, en los términos previstos por la normativa aplicable. Algunos derechos pueden estar limitados cuando exista una obligación legal de conservar la información.",
      "Para ejercer tus derechos o resolver dudas sobre esta Política, escríbenos a privacidad@zentto.net.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <LegalDoc
      title="Política de Privacidad"
      updatedAt="junio de 2026"
      intro="En Zentto Web3 tratamos tus datos personales con responsabilidad y transparencia. Esta Política describe cómo los recopilamos, usamos y protegemos."
      sections={SECTIONS}
    />
  );
}
