import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Offer, Customer } from '../types';

export const getOfferHtml = (offer: Offer, customer: Customer | undefined, t: (key: string, replacements?: Record<string, string>) => string, logoBase64: string): string => {
    const accentColor = '#3b82f6';
    const textColor = '#1e293b';
    const mutedColor = '#475569';
    return `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; width: 210mm; min-height: 297mm; background: white; color: ${textColor}; padding: 15mm; box-sizing: border-box; display: flex; flex-direction: column; font-size: 10pt; line-height: 1.5;">
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12mm;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <img src="${logoBase64}" style="max-width: 80mm; max-height: 25mm;"/>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right; font-size: 9pt; color: ${mutedColor};">
              <p style="margin: 0;">İvedik OSB Melih Gökçek Blv. No:15/1</p>
              <p style="margin: 0;">Yenimahalle / ANKARA</p>
              <p style="margin: 0;">satis@cnkkesicitakim.com.tr</p>
              <p style="margin: 0; font-weight: bold; color: ${accentColor};">www.cnkkesicitakim.com.tr</p>
            </td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8mm; font-size: 10pt;">
            <tr>
                <td style="width: 55%; vertical-align: top; border: 1px solid #e2e8f0; padding: 5mm; border-radius: 8px;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 11pt;">${t('offerTo')}:</p>
                    <p style="margin: 0; font-weight: bold; color: ${accentColor};">${customer?.name ?? ''}</p>
                    <p style="margin: 0;">${offer.firma.yetkili}</p>
                    <p style="margin: 0;">${offer.firma.telefon}</p>
                    <p style="margin: 0;">${offer.firma.eposta}</p>
                </td>
                <td style="width: 45%; vertical-align: top; padding-left: 8mm; text-align: right;">
                    <h1 style="font-size: 22pt; font-weight: 800; margin: 0 0 4mm 0; color: ${accentColor};">FİYAT TEKLİFİ</h1>
                    <p style="margin: 0;"><strong>${t('offerNo')}:</strong> ${offer.teklifNo}</p>
                    <p style="margin: 0;"><strong>${t('offerDate')}:</strong> ${new Date(offer.firma.teklifTarihi).toLocaleDateString('tr-TR')}</p>
                    <p style="margin: 0;"><strong>${t('vade')}:</strong> ${offer.firma.vade}</p>
                </td>
            </tr>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 5mm;">
          <thead style="background-color: #f1f5f9; color: ${mutedColor}; text-align: left; font-weight: bold; text-transform: uppercase;">
            <tr>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor};">#</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor};">${t('description')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: center;">${t('quantity')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: center;">${t('unit')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: right;">${t('unitPrice')}</th>
              <th style="padding: 4mm 3mm; border-bottom: 2px solid ${accentColor}; text-align: right;">${t('total')}</th>
            </tr>
          </thead>
          <tbody>
            ${offer.items.map((item, index) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 3mm; text-align: center;">${index + 1}</td>
                <td style="padding: 3mm;">${item.cins}</td>
                <td style="padding: 3mm; text-align: center;">${item.miktar}</td>
                <td style="padding: 3mm; text-align: center;">${item.birim}</td>
                <td style="padding: 3mm; text-align: right;">${item.fiyat.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                <td style="padding: 3mm; text-align: right;">${item.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table style="width: 100%; margin-left: auto; margin-top: 8mm; max-width: 45%;">
            <tr>
                <td style="text-align: right; padding: 2mm 3mm;">${t('subtotal')}</td>
                <td style="text-align: right; padding: 2mm 3mm; width: 100px;">${offer.toplam.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
            <tr>
                <td style="text-align: right; padding: 2mm 3mm;">${t('vat')} (20%)</td>
                <td style="text-align: right; padding: 2mm 3mm;">${offer.kdv.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt;">
                <td style="text-align: right; padding: 3mm; border-top: 2px solid ${accentColor};">${t('grandTotal')}</td>
                <td style="text-align: right; padding: 3mm; border-top: 2px solid ${accentColor};">${offer.genelToplam.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            </tr>
        </table>
        
        <div style="flex-grow: 1;"></div>
        
        <div style="font-size: 8pt; color: ${mutedColor}; border-top: 1px solid #e2e8f0; padding-top: 4mm;">
          <p style="margin: 0 0 4px 0;"><strong>${t('notes')}:</strong> ${offer.notlar}</p>
          <p style="margin: 0;">Saygılarımızla, ${offer.teklifVeren.yetkili}</p>
        </div>
      </div>
    `;
};

export const downloadOfferAsPdf = async (offer: Offer, customer: Customer | undefined, t: (key: string, replacements?: Record<string, string>) => string, logoBase64: string): Promise<{success: boolean}> => {
    
    const offerContentHtml = getOfferHtml(offer, customer, t, logoBase64);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Render off-screen
    container.innerHTML = offerContentHtml;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container.firstChild as HTMLElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`Teklif_${offer.teklifNo}.pdf`);
        return { success: true };
    } catch (error) {
        console.error('PDF generation error:', error);
        return { success: false };
    } finally {
        document.body.removeChild(container);
    }
};