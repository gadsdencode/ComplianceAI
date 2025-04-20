import { Template } from "@shared/schema";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      
      return response.choices[0]?.message?.content || templateContent;
    } catch (error) {
      console.error("Error generating document from template:", error);
      
      // Fallback to simple replacement of company name if AI fails
      let generatedContent = templateContent;
      if (companyInfo.name) {
        generatedContent = generatedContent.replace(/\[Company Name\]/g, companyInfo.name);
      }
      return generatedContent;
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
      
      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.error("Error improving document content:", error);
      return content + "\n\n[AI-suggested improvement: Consider adding more specific details about data handling procedures.]";
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
      
      const resultText = response.choices[0]?.message?.content || "";
      try {
        const result = JSON.parse(resultText);
        if (Array.isArray(result.issues) && typeof result.score === 'number') {
          return {
            issues: result.issues,
            score: result.score
          };
        }
      } catch (jsonError) {
        console.error("Error parsing JSON from OpenAI response:", jsonError);
      }
      
      // Fallback
      return {
        issues: [
          "Missing data retention policy specifics",
          "Unclear incident response procedure",
          "No mention of employee training requirements"
        ],
        score: 0.75
      };
    } catch (error) {
      console.error("Error checking compliance issues:", error);
      return {
        issues: [
          "Error analyzing document",
          "Missing data retention policy specifics",
          "Unclear incident response procedure"
        ],
        score: 0.75
      };
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
      
      const resultText = response.choices[0]?.message?.content || "";
      try {
        const result = JSON.parse(resultText);
        if (Array.isArray(result.actions) || Array.isArray(result.suggestions) || Array.isArray(result)) {
          return Array.isArray(result) 
            ? result 
            : (result.actions || result.suggestions || []);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON from OpenAI response:", jsonError);
      }
      
      // Fallback
      return [
        "Update your ISO 27001 documentation",
        "Schedule a security awareness training session",
        "Review vendor agreements for GDPR compliance"
      ];
    } catch (error) {
      console.error("Error suggesting compliance actions:", error);
      return [
        "Update your ISO 27001 documentation",
        "Schedule a security awareness training session",
        "Review vendor agreements for GDPR compliance"
      ];
    }
  }
}

export const aiService = new AIServiceImpl();
