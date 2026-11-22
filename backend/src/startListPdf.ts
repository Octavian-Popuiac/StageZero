import PDFDocument from 'pdfkit';
import type { snapshot } from './rally.js';

export async function startListPdf(state: ReturnType<typeof snapshot>): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 36,
    info: { Title: 'Ordem de partida SS1', Author: 'StageZero', Subject: 'Grelha final da Baja de Lagos' },
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.once('end', () => resolve(Buffer.concat(chunks)));
    doc.once('error', reject);
  });
  const left = 36;
  const width = doc.page.width - left * 2;
  const columns = [
    { label: 'Pos.', width: 42 }, { label: 'Equipa', width: 52 }, { label: 'Marca', width: 110 },
    { label: 'Piloto / país', width: 228 }, { label: 'Navegador / país', width: 228 },
    { label: 'Prólogo', width: width - 660 },
  ];
  let page = 0;

  function header() {
    page++;
    doc.rect(left, 32, width, 78).fill('#10283b');
    doc.rect(left, 32, 6, 78).fill('#f5ad23');
    doc.fillColor('#9dd6f0').font('Helvetica-Bold').fontSize(10).text('STAGEZERO  /  BAJA DE LAGOS', 54, 48);
    doc.fillColor('#ffffff').fontSize(25).text('Ordem de partida SS1', 54, 64);
    doc.font('Helvetica').fontSize(10).text(`Grelha final  •  ${state.eligibleCount} equipas`, 54, 93);
    doc.rect(left, 122, width, 23).fill('#195d83');
    let x = left;
    for (const column of columns) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
        .text(column.label, x + 7, 129, { width: column.width - 14, lineBreak: false });
      x += column.width;
    }
    doc.fillColor('#496375').font('Helvetica').fontSize(9)
      .text('StageZero  /  Ordem confirmada', left, doc.page.height - 60, { lineBreak: false })
      .text(`Página ${page}`, left, doc.page.height - 60, { width, align: 'right', lineBreak: false });
  }

  header();
  let y = 145;
  for (const slot of state.startPositions) {
    const team = slot.competitor;
    if (!team) continue;
    const cells = [
      String(slot.position), `#${team.number}`, team.carBrand,
      `${team.pilotName}\n${team.pilotCountry}`, `${team.navigatorName}\n${team.navigatorCountry}`, team.time,
    ];
    const rowHeight = Math.max(35, ...cells.map((value, i) =>
      doc.font(i < 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        .heightOfString(value, { width: columns[i].width - 14 }) + 12));
    if (y + rowHeight > doc.page.height - 73) {
      doc.addPage();
      header();
      y = 145;
    }
    doc.rect(left, y, width, rowHeight).fill(slot.position % 2 ? '#edf5fa' : '#ffffff');
    let x = left;
    cells.forEach((value, i) => {
      doc.fillColor('#10283b').font(i < 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        .text(value, x + 7, y + 6, { width: columns[i].width - 14 });
      x += columns[i].width;
    });
    y += rowHeight;
  }
  doc.end();
  return result;
}
