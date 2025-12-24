import { Template } from "../shared/schema.js";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Custom error class for AI service unavailability
export class AIServiceUnavailableError extends Error {
  constructor(message: string = 'AI Service temporarily unavailable') {
    super('AI_SERVICE_UNAVAILABLE');
    this.name = 'AIServiceUnavailableError';
  }
}

export interface AIService {
  generateDocumentFromTemplate(templateContent: string, companyInfo: any): Promise<string>;
  improveDocumentContent(content: string): Promise<string>;
  checkComplianceIssues(content: string): Promise<{ issues: string[], score: number }>;
  suggestComplianceActions(currentCompliance: any): Promise<string[]>;
}

class AIServiceImpl implements AIService {
  async generateDocumentFromTemplate(templateContent: string, companyInfo: any): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a legal assistant that specializes in creating compliance documents. Fill in the template with the company information provided. Maintain a professional tone and ensure all relevant placeholders are replaced with specific company details."
          },
          {
            role: "user",
            content: `Please fill in this compliance document template with the company information provided: \n\nTEMPLATE:\n${templateContent}\n\nCOMPANY INFO:\n${JSON.stringify(companyInfo)}`
          }
        ],
        temperature: 0.3,
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceUnavailableError();
      }
      
      return content;
    } catch (error: any) {
      console.error("Error generating document from template:", error);
      
      // If OpenAI API key is not configured, throw a clear error
      if (error.message?.includes('API key') || error.code === 'invalid_api_key') {
        throw new Error('AI_SERVICE_NOT_CONFIGURED');
      }
      
      // If it's already an AIServiceUnavailableError, rethrow it
      if (error instanceof AIServiceUnavailableError) {
        throw error;
      }
      
      // For other errors, throw AI_SERVICE_UNAVAILABLE
      throw new AIServiceUnavailableError();
    }
  }
  
  async improveDocumentContent(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a compliance expert who specializes in improving compliance documents. Enhance the document to be more comprehensive, clear, and legally robust while maintaining its original intent. Make specific improvements related to compliance, regulation adherence, and clarity."
          },
          {
            role: "user",
            content: `Please improve this compliance document to be more comprehensive and clear:\n\n${content}`
          }
        ],
        temperature: 0.5,
      });
      
      const improvedContent = response.choices[0]?.message?.content;
      if (!improvedContent) {
        throw new AIServiceUnavailableError();
      }
      
      return improvedContent;
    } catch (error: any) {
      console.error("Error improving document content:", error);
      
      if (error.message?.includes('API key') || error.code === 'invalid_api_key') {
        throw new Error('AI_SERVICE_NOT_CONFIGURED');
      }
      
      if (error instanceof AIServiceUnavailableError) {
        throw error;
      }
      
      throw new AIServiceUnavailableError();
    }
  }
  
  async checkComplianceIssues(content: string): Promise<{ issues: string[], score: number }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a compliance auditor specializing in identifying issues in compliance documents. Analyze the document and identify any compliance issues, missing elements, or areas that need improvement. Provide a compliance score from 0.0 to 1.0 where 1.0 is fully compliant. Return your response in JSON format with 'issues' as an array of strings and 'score' as a number."
          },
          {
            role: "user",
            content: `Please analyze this compliance document for issues:\n\n${content}`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      
      const resultText = response.choices[0]?.message?.content;
      if (!resultText) {
        throw new AIServiceUnavailableError();
      }
      
      try {
        const result = JSON.parse(resultText);
        if (Array.isArray(result.issues) && typeof result.score === 'number') {
          return {
            issues: result.issues,
            score: result.score
          };
        }
        throw new Error('Invalid response format');
      } catch (jsonError) {
        console.error("Error parsing JSON from OpenAI response:", jsonError);
        throw new AIServiceUnavailableError();
      }
    } catch (error: any) {
      console.error("Error checking compliance issues:", error);
      
      if (error.message?.includes('API key') || error.code === 'invalid_api_key') {
        throw new Error('AI_SERVICE_NOT_CONFIGURED');
      }
      
      if (error instanceof AIServiceUnavailableError) {
        throw error;
      }
      
      throw new AIServiceUnavailableError();
    }
  }
  
  async suggestComplianceActions(currentCompliance: any): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a compliance consultant that recommends specific and actionable steps to improve a company's compliance posture. Based on the current compliance state, suggest 3-5 high-priority actions the company should take. Return your response as a JSON array of strings."
          },
          {
            role: "user",
            content: `Based on this current compliance state, what actions should the company take:\n\n${JSON.stringify(currentCompliance)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      const resultText = response.choices[0]?.message?.content;
      if (!resultText) {
        throw new AIServiceUnavailableError();
      }
      
      try {
        const result = JSON.parse(resultText);
        if (Array.isArray(result.actions) || Array.isArray(result.suggestions) || Array.isArray(result)) {
          return Array.isArray(result) 
            ? result 
            : (result.actions || result.suggestions || []);
        }
        throw new Error('Invalid response format');
      } catch (jsonError) {
        console.error("Error parsing JSON from OpenAI response:", jsonError);
        throw new AIServiceUnavailableError();
      }
    } catch (error: any) {
      console.error("Error suggesting compliance actions:", error);
      
      if (error.message?.includes('API key') || error.code === 'invalid_api_key') {
        throw new Error('AI_SERVICE_NOT_CONFIGURED');
      }
      
      if (error instanceof AIServiceUnavailableError) {
        throw error;
      }
      
      throw new AIServiceUnavailableError();
    }
  }
}

export const aiService = new AIServiceImpl();
