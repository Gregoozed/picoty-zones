import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { PRODUCT_LABELS, type ProductType } from '../types';

interface ExportOptions {
  product: ProductType;
  viewMode: string;
  filiales: string[];
  departements: string[];
}

const MODE_LABELS: Record<string, string> = {
  departement: 'Départements',
  region: 'Régions',
  commune: 'Communes',
};

export async function exportMapToPdf(options: ExportOptions): Promise<void> {
  const mapEl = document.querySelector('.leaflet-container') as HTMLElement | null;
  if (!mapEl) throw new Error('Carte introuvable');

  const canvas = await html2canvas(mapEl, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const imgW = canvas.width;
  const imgH = canvas.height;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerH = 18;
  const footerH = 8;

  // --- En-tête ---
  pdf.setFillColor(26, 42, 80);
  pdf.rect(0, 0, pageW, headerH, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Groupe Picoty — Zones de Chalandise', margin, 12);

  // --- Sous-titre ---
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const subtitle = `${PRODUCT_LABELS[options.product]} · Vue ${MODE_LABELS[options.viewMode] || options.viewMode}`;
  pdf.text(subtitle, margin, headerH + 6);

  // --- Calcul espace pour la carte et les filtres ---
  // Réserver de l'espace sous la carte pour les filtres
  const filterBlockH = 22; // hauteur réservée pour le bloc filtres
  const mapY = headerH + 10;
  const availW = pageW - 2 * margin;
  const availH = pageH - mapY - footerH - filterBlockH;
  const ratio = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * ratio;
  const drawH = imgH * ratio;

  pdf.addImage(imgData, 'PNG', margin, mapY, drawW, drawH);

  // --- Bloc filtres actifs sous la carte ---
  const filterY = mapY + drawH + 4;

  // Ligne séparatrice
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, filterY, pageW - margin, filterY);

  const colX1 = margin;
  const colX2 = pageW / 2;
  const curY = filterY + 5;

  // Filiales
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text(`Filiales (${options.filiales.length}) :`, colX1, curY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(90, 90, 90);
  const filialesText = options.filiales.join(', ');
  const filialesLines = pdf.splitTextToSize(filialesText, availW / 2 - 5) as string[];
  pdf.text(filialesLines, colX1, curY + 4);

  // Départements
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  if (options.departements.length > 0) {
    pdf.text(`Départements (${options.departements.length}) :`, colX2, curY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(90, 90, 90);
    const deptsText = options.departements.sort((a, b) => a.localeCompare(b)).join(', ');
    const deptsLines = pdf.splitTextToSize(deptsText, availW / 2 - 5) as string[];
    pdf.text(deptsLines, colX2, curY + 4);
  } else {
    pdf.text('Départements : Tous', colX2, curY);
  }

  // --- Pied de page ---
  pdf.setFontSize(7);
  pdf.setTextColor(180, 180, 180);
  pdf.text(
    `Export le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} — © Groupe Picoty`,
    margin,
    pageH - 3,
  );

  pdf.save(`picoty-zones-${options.product}-${options.viewMode}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
