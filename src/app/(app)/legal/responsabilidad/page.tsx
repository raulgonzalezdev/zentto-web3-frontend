"use client";

import { LegalDoc, type LegalSection } from "@/components/ui/LegalDoc";

const SECTIONS: LegalSection[] = [
  {
    heading: "Naturaleza del servicio",
    paragraphs: [
      "Zentto Web3 es una plataforma tecnológica que facilita la custodia y operación con criptoactivos. No constituye asesoría financiera, legal, contable ni de inversión. Las decisiones que tomes son de tu exclusiva responsabilidad.",
    ],
  },
  {
    heading: "Riesgos de los criptoactivos",
    paragraphs: [
      "Los criptoactivos son instrumentos de alto riesgo y elevada volatilidad. Su valor puede subir o bajar de forma abrupta e incluso reducirse a cero. No inviertas fondos que no puedas permitirte perder.",
      "Las operaciones en redes blockchain son, por naturaleza, irreversibles. Un error en la dirección de destino, la red o el token seleccionado puede ocasionar la pérdida total e irrecuperable de tus fondos.",
    ],
  },
  {
    heading: "Seguridad de tu cuenta",
    paragraphs: [
      "Eres responsable de proteger tus credenciales de acceso y tu segundo factor de autenticación (2FA). Nunca compartas tus códigos de verificación, contraseñas ni claves con terceros, incluido el personal de soporte.",
      "El operador nunca te pedirá tu contraseña ni tus códigos 2FA por teléfono, correo o mensajería. Desconfía de cualquier comunicación que lo solicite: probablemente sea un intento de fraude.",
    ],
  },
  {
    heading: "No compartas tus datos sensibles",
    paragraphs: [
      "No reveles tus claves privadas, frases de recuperación, ni códigos de un solo uso. Quien obtenga esa información puede tomar el control de tus fondos.",
      "En el mercado P2P, comparte únicamente los datos estrictamente necesarios para cobrar o pagar una operación. Verifica siempre la recepción del pago en tu propia cuenta antes de liberar cripto del escrow.",
    ],
  },
  {
    heading: "Operaciones P2P",
    paragraphs: [
      "El operador custodia el escrow pero no es parte de la negociación entre usuarios ni garantiza el comportamiento de las contrapartes. Las pérdidas derivadas de pagos no recibidos, fraudes entre usuarios o información falsa proporcionada por una contraparte son responsabilidad de las partes involucradas.",
    ],
  },
  {
    heading: "Limitación de responsabilidad",
    paragraphs: [
      "El operador no será responsable por pérdidas ocasionadas por la volatilidad del mercado, fallos o congestión de redes blockchain de terceros, errores del usuario, accesos no autorizados derivados del manejo negligente de las credenciales, ni por interrupciones del servicio fuera de su control razonable.",
      "El uso de la Plataforma implica la aceptación de estos riesgos y de las limitaciones aquí descritas.",
    ],
  },
  {
    heading: "Cumplimiento normativo",
    paragraphs: [
      "El usuario se compromete a usar la Plataforma conforme a la ley y a no utilizarla para actividades ilícitas. El operador aplica controles de prevención de lavado de dinero y puede solicitar información adicional, retener operaciones o reportar a las autoridades cuando corresponda.",
    ],
  },
];

export default function ResponsabilidadPage() {
  return (
    <LegalDoc
      title="Aviso de Responsabilidad"
      updatedAt="junio de 2026"
      intro="Operar con criptoactivos conlleva riesgos. Lee este aviso para entender tus responsabilidades y cómo proteger tus fondos y tus datos."
      sections={SECTIONS}
    />
  );
}
