const OpenAI = require('openai');
const sharp = require('sharp');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processTextInput(text, profile, conversationHistory) {
    try {
      const systemPrompt = this.buildSystemPrompt(profile);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Last 10 messages for context
        { role: 'user', content: text }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      return {
        response: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Text processing error:', error);
      throw new Error('Failed to process text input');
    }
  }

  async processImageInput(imageBuffer, profile, conversationHistory) {
    try {
      // Resize and optimize image
      const optimizedImage = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Convert to base64 for OpenAI
      const base64Image = optimizedImage.toString('base64');

      // Analyze image with GPT-4 Vision
      const imageAnalysis = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and provide context for a flirtatious conversation. 
                Describe what you see, the mood, setting, and suggest how to respond flirtatiously. 
                Keep it respectful and appropriate.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 200
      });

      const analysis = imageAnalysis.choices[0].message.content;

      // Generate flirtatious response based on analysis
      const systemPrompt = this.buildSystemPrompt(profile);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Based on this image analysis: "${analysis}", suggest a flirtatious response.` }
        ],
        max_tokens: 200,
        temperature: 0.8
      });

      return {
        response: response.choices[0].message.content,
        analysis,
        usage: response.usage
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image input');
    }
  }

  async processVoiceInput(audioBuffer, profile, conversationHistory) {
    try {
      // Convert audio to text using Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
        language: profile.conversationStyle.language || 'en'
      });

      const transcribedText = transcription.text;

      // Process the transcribed text
      const textResponse = await this.processTextInput(transcribedText, profile, conversationHistory);

      return {
        transcription: transcribedText,
        response: textResponse.response,
        usage: textResponse.usage
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error('Failed to process voice input');
    }
  }

  async processScreenshotInput(imageBuffer, profile, conversationHistory) {
    try {
      // Similar to image processing but with screenshot-specific analysis
      const optimizedImage = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const base64Image = optimizedImage.toString('base64');

      // Analyze screenshot with focus on text content and context
      const screenshotAnalysis = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `This is a screenshot. Analyze the text content, context, and suggest how to respond flirtatiously. 
                Focus on any messages, social media posts, or content that could be used for conversation. 
                Be creative and playful in your suggestions.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 250
      });

      const analysis = screenshotAnalysis.choices[0].message.content;

      // Generate response based on screenshot analysis
      const systemPrompt = this.buildSystemPrompt(profile);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Based on this screenshot analysis: "${analysis}", suggest a flirtatious response or conversation starter.` }
        ],
        max_tokens: 200,
        temperature: 0.8
      });

      return {
        response: response.choices[0].message.content,
        analysis,
        usage: response.usage
      };
    } catch (error) {
      console.error('Screenshot processing error:', error);
      throw new Error('Failed to process screenshot input');
    }
  }

  buildSystemPrompt(profile) {
    const { targetPerson, conversationStyle } = profile;
    
    let prompt = `You are RizzMate, an AI assistant that helps with flirtatious conversations. `;
    
    // Add personality context
    if (targetPerson.personality !== 'unknown') {
      prompt += `The target person is ${targetPerson.personality}. `;
    }
    
    // Add relationship context
    if (targetPerson.relationship !== 'stranger') {
      prompt += `Your relationship with them is: ${targetPerson.relationship}. `;
    }
    
    // Add context
    if (targetPerson.context) {
      prompt += `The context is: ${targetPerson.context}. `;
    }
    
    // Add conversation style
    prompt += `Your conversation style should be ${conversationStyle.tone} and ${conversationStyle.approach}. `;
    
    // Add guidelines
    prompt += `
    Guidelines:
    - Be respectful and appropriate
    - Be creative and engaging
    - Match the conversation tone
    - Keep responses concise (1-3 sentences)
    - Be authentic and genuine
    - Use humor when appropriate
    - Be confident but not arrogant
    - Show interest in the other person
    - Be playful and fun
    - Avoid being too forward or inappropriate
    `;
    
    return prompt;
  }

  async generateConversationStarters(profile) {
    try {
      const systemPrompt = this.buildSystemPrompt(profile);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate 5 creative conversation starters based on the profile information. Make them engaging and appropriate for the context.' }
        ],
        max_tokens: 300,
        temperature: 0.9
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Conversation starter generation error:', error);
      throw new Error('Failed to generate conversation starters');
    }
  }
}

module.exports = new AIService();
