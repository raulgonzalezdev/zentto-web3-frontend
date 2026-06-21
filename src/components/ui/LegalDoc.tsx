"use client";

import * as React from "react";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import { PageHeader } from "@/components/ui/PageHeader";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/** Render limpio y legible de un documento legal por secciones. */
export function LegalDoc({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <Box sx={{ maxWidth: 880, mx: "auto" }}>
      <PageHeader
        title={title}
        subtitle={`Última actualización: ${updatedAt}`}
      />
      <Card>
        <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            {intro}
          </Typography>
          {sections.map((s, i) => (
            <Box key={s.heading} sx={{ mb: i < sections.length - 1 ? 3 : 0 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                {`${i + 1}. ${s.heading}`}
              </Typography>
              {s.paragraphs.map((p, j) => (
                <Typography
                  key={j}
                  variant="body2"
                  sx={{ mb: 1.25, lineHeight: 1.75, color: "text.primary" }}
                >
                  {p}
                </Typography>
              ))}
              {i < sections.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary">
            Zentto Web3 es un servicio en evolución. Este documento puede
            actualizarse; los cambios relevantes se notificarán dentro de la
            aplicación. Para consultas escribe a soporte@zentto.net.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LegalDoc;
