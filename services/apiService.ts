import { db } from './dbService';

// This file simulates a secure backend API. In a real-world scenario,
// this would use `fetch` to make calls to a server, which would then
// handle business logic and external API calls (like to Gemini).

export const api = {
  /**
   * Simulates a user login API endpoint.
   * Checks credentials against the local database.
   */
  async login(username: string, password: string): Promise<{ success: boolean; messageKey: string }> {
    await new Promise(res => setTimeout(res, 500)); // Simulate network latency
    const user = await db.users.where('username').equalsIgnoreCase(username).first();
    if (!user) {
        return { success: false, messageKey: 'userNotFound' };
    }
    if (user.password !== password) {
        return { success: false, messageKey: 'invalidPassword' };
    }
    return { success: true, messageKey: 'loggedInWelcome' };
  },

  /**
   * Simulates a secure backend endpoint for calling the Gemini API.
   * The backend would use its secret API key here.
   */
  async generateText(prompt: string): Promise<string> {
    console.log(`Simulating Gemini API call with prompt: "${prompt.substring(0, 50)}..."`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return `"${prompt.substring(0, 30)}..." istemi için sunucudan gelen yapay zeka cevabı. Bu metin, gerçek bir yapay zeka modeli yerine simüle edilmiş bir API'den gelmektedir.`;
  },
  
   /**
   * Simulates parsing a business card via a backend service.
   */
  async parseCard(base64Image: string): Promise<any> {
    console.log('Simulating business card parsing via API.');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
        name: 'Simüle Edilmiş İsim',
        company: 'Simülasyon A.Ş.',
        email: 'test@simulasyon.com',
        phone: '0312 555 1234',
        address: 'Simülasyon Vadisi, Teknokent, Ankara',
    };
  },
  
  /**
   * Simulates sending a password reset code via email from the backend.
   */
  async sendPasswordResetCode(email: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating sending password reset code to: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = await db.users.where('username').equalsIgnoreCase(email).first();
    if (!user) {
        // To prevent user enumeration attacks, a real API might always return success.
        // For our simulation, returning failure is clearer for development.
        return { success: false, messageKey: 'userNotFound' };
    }
    // The backend would generate a secure code and email it. We just simulate success.
    console.log(`Simulated code for ${email} is 123456`);
    return { success: true, messageKey: 'resetCodeSent' };
  },

  /**
   * Simulates verifying the password reset code on the backend.
   */
  async verifyPasswordResetCode(email: string, code: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating verifying code ${code} for email ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (code === '123456') { // Our simulated "correct" code
        return { success: true, messageKey: 'codeVerified' };
    }
    return { success: false, messageKey: 'invalidCode' };
  }
};