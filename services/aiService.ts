
import { Offer, Customer, User } from '../types';
import { api } from './apiService';

type AIResult = Promise<{ success: boolean; text: string }>;

const callAI = async (prompt: string): AIResult => {
    try {
        const responseText = await api.generateText(prompt);
        return { success: true, text: responseText };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Yapay zeka servisinde beklenmedik bir hata oluştu.";
        return { success: false, text: message };
    }
};

export const parseBusinessCard = async (base64Image: string): Promise<{ success: boolean; data?: any; text: string }> => {
     try {
        const responseData = await api.parseCard(base64Image);
        return { success: true, data: responseData, text: "Kartvizit başarıyla okundu." };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Kartvizit okunurken beklenmedik bir hata oluştu.";
        return { success: false, text: message };
    }
};

export const summarizeText = (text: string): AIResult => 
    callAI(`Aşağıdaki görüşme notlarını profesyonel bir dille, anahtar noktaları vurgulayarak özetle:\n\n---\n${text}\n---\n\nÖzet:`);

export const enhanceDescription = (description: string): AIResult => 
    callAI(`Aşağıdaki ürün açıklamasını daha çekici ve profesyonel hale getirmek için metin önerileri sun:\n\n"${description}"`);

export const suggestNextStep = (customer: Customer): AIResult => {
    const prompt = `CRM Müşteri Bilgileri:\nAdı: ${customer.name}\nNotlar: ${customer.notes}\n\nBu müşteriyle olan etkileşim geçmişine göre bir sonraki mantıklı adımı öner (örn: "Bir takip e-postası gönderin", "Bir demo planlayın").\n\nÖnerilen Sonraki Adım:`;
    return callAI(prompt);
};

export const generateFollowUpEmail = async (offer: Offer, customer: Customer | undefined): AIResult => {
    const prompt = `Müşteri: ${customer?.name}, Yetkili: ${offer.firma.yetkili}, Teklif No: ${offer.teklifNo}, Toplam: ${offer.genelToplam} TL. Bu bilgilere göre, müşteriye gönderilecek profesyonel bir takip e-postası taslağı oluştur. E-posta sadece metin olarak oluşturulsun.`;
    return callAI(prompt);
};

export const analyzeOpportunities = (customer: Customer): AIResult => {
    const prompt = `CRM Müşteri Bilgileri:\nAdı: ${customer.name}\nNotlar: ${customer.notes}\n\nBu müşteriyle ilgili notları analiz ederek potansiyel satış fırsatlarını veya riskleri belirle. Kısa ve maddeler halinde cevap ver.\n\nAnaliz:`;
    return callAI(prompt);
};

export const analyzeSentiment = (text: string): AIResult => {
    const prompt = `Aşağıdaki metnin genel hissiyatını (pozitif, negatif, nötr) belirle ve nedenini kısaca açıkla:\n\n---\n${text}\n---\n\nHissiyat:`;
    return callAI(prompt);
};

export const analyzeSalesPerformance = (user: string, target: number, current: number, daysLeft: number): AIResult => {
    const prompt = `Bir satış koçu olarak, aşağıdaki satış performansı verilerine göre bir öneride bulun. Kullanıcı: ${user}, Aylık Hedef: ${target} TL, Mevcut Satış: ${current} TL, Kalan Gün: ${daysLeft}. Hedefe ulaşmak için somut ve uygulanabilir bir tavsiye ver.`;
    return callAI(prompt);
};

// Fix: Added missing function required by ReconciliationPage.
export const generateReconciliationEmail = (customer: Customer, type: string, period: string, amount: number): AIResult => {
    const prompt = `Müşteri: ${customer.name}, Mutabakat Türü: ${type}, Dönem: ${period}, Tutar: ${amount.toLocaleString('tr-TR')} TL. Bu bilgilere göre, müşteriye gönderilecek nazik ve profesyonel bir mutabakat e-postası metni oluştur. E-posta sadece metin olarak oluşturulsun.`;
    return callAI(prompt);
};

// Fix: Added missing function required by ReconciliationPage.
export const analyzeDisagreement = (disagreementText: string): AIResult => {
    const prompt = `Bir müşteri mutabakata itiraz etti. Müşterinin itiraz metni aşağıdadır. Bu metni analiz et, ana itiraz noktalarını özetle ve çözüm için bir sonraki adımı öner.\n\nMüşteri Metni: "${disagreementText}"\n\nAnaliz ve Öneri:`;
    return callAI(prompt);
};


// --- AI Hub Functions ---
export const generateMarketingEmail = (topic: string): AIResult => 
    callAI(`Bir satış ve pazarlama uzmanı olarak, "${topic}" konusuyla ilgili potansiyel müşterilere gönderilecek, dikkat çekici ve profesyonel bir pazarlama e-postası metni yaz.`);

export const analyzeCustomerInteractionForHub = (customerNotes: string): AIResult => 
    callAI(`Bir CRM uzmanı olarak, aşağıdaki müşteri notlarını analiz et. Müşterinin hissiyatını, potansiyel satış fırsatlarını ve bir sonraki adım için önerilerini madde madde belirt.\n\nNotlar:\n${customerNotes}`);

export const createMarketReport = (topic: string): AIResult => 
    callAI(`Bir pazar analisti olarak, "${topic}" konusuyla ilgili kısa bir pazar araştırması raporu hazırla. Rapor, temel trendleri, fırsatları ve zorlukları içermelidir.`);

export const getFinancialSummary = (data: string): AIResult => 
    callAI(`Bir finansal analist olarak, şu verileri analiz et ve bir özet çıkar: "${data}". Temel finansal oranları (kar marjı, vb.) hesapla ve yorumla.`);

export const answerTechnicalQuestion = (question: string): AIResult => 
    callAI(`Bir yazılım uzmanı olarak, aşağıdaki teknik soruyu cevapla: "${question}"`);

export const executeAgentTask = (task: string): AIResult => 
    callAI(`Bir AI ajanı olarak, şu görevi gerçekleştir ve sonucunu raporla: "${task}". Görevi adım adım planla ve uygula.`);
