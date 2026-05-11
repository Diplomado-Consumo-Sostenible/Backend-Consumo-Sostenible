import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReviewSentiment } from '../../shared/entities/review.entity';

export interface AiAnalysisResult {
  sentiment: ReviewSentiment;
  aiStars: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly AI_API_URL: string;

  constructor(private configService: ConfigService) {

    this.AI_API_URL = this.configService.get<string>('AI_API_URL') || '';
  }

  async analyzeSentiment(comment: string): Promise<AiAnalysisResult> {
    try {
      console.log('Intentando conectar a IA en la URL:', this.AI_API_URL);

      if (!this.AI_API_URL) {
        throw new Error('La URL de la IA está vacía o undefined en la configuración');
      }
      const response = await fetch(this.AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: comment }),
      });

      if (!response.ok) {
        throw new Error(`Error de la API IA: ${response.statusText}`);
      }

      const data = await response.json();
      
      let sentiment = ReviewSentiment.NEUTRAL;
      if (data.codigo === 'POS') sentiment = ReviewSentiment.POSITIVE;
      if (data.codigo === 'NEG') sentiment = ReviewSentiment.NEGATIVE;

      return {
        sentiment,
        aiStars: data.estrellas 
      };
    } catch (error) {
      this.logger.error(`Fallo al analizar sentimiento: ${error.message}`);
      return { sentiment: ReviewSentiment.NEUTRAL, aiStars: 3 }; 
    }
  }
}