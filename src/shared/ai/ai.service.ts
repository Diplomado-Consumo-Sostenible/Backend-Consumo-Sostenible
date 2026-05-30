import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationUrgency } from '../../notifications/dto/sentiment-notification.dto';
import { WeeklySummaryStatsDto } from '../../notifications/dto/weekly-summary.dto';
import { ReviewSentiment } from '../../shared/entities/review.entity';

export interface AiProbabilidades {
  positivo: number;
  negativo: number;
  neutro: number;
}

export interface AiAnalysisResult {
  sentiment: ReviewSentiment;
  aiStars: number;
  probabilidades: AiProbabilidades;
  urgency: NotificationUrgency;
}

export interface ReviewSampleDto {
  comment: string;
  sentiment: string;
  rating: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly AI_API_URL: string;
  private readonly GEMINI_API_KEY: string;
  private readonly GEMINI_MODEL = 'gemini-flash-lite-latest';

  constructor(private configService: ConfigService) {
    this.AI_API_URL = this.configService.get<string>('AI_API_URL') || '';
    this.GEMINI_API_KEY =
      this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  private calculateUrgency(
    probabilidades: AiProbabilidades,
    sentiment: ReviewSentiment,
  ): NotificationUrgency {
    if (sentiment === ReviewSentiment.NEGATIVE) {
      if (probabilidades.negativo > 0.75) return 'high';
      if (probabilidades.negativo > 0.5) return 'medium';
    }
    return 'low';
  }

  async analyzeSentiment(comment: string): Promise<AiAnalysisResult> {
    try {
      if (!this.AI_API_URL) throw new Error('AI_API_URL no configurada');

      const response = await fetch(this.AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: comment }),
      });

      if (!response.ok) {
        throw new Error(
          `Error API IA: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      let sentiment = ReviewSentiment.NEUTRAL;
      if (data.codigo === 'POS') sentiment = ReviewSentiment.POSITIVE;
      if (data.codigo === 'NEG') sentiment = ReviewSentiment.NEGATIVE;

      const probabilidades: AiProbabilidades = {
        positivo: data.probabilidades?.positivo ?? 0,
        negativo: data.probabilidades?.negativo ?? 0,
        neutro: data.probabilidades?.neutro ?? 1,
      };

      return {
        sentiment,
        aiStars: data.estrellas ?? 3,
        probabilidades,
        urgency: this.calculateUrgency(probabilidades, sentiment),
      };
    } catch (error) {
      this.logger.error(
        `Fallo al analizar sentimiento: ${(error as Error).message}`,
      );
      return {
        sentiment: ReviewSentiment.NEUTRAL,
        aiStars: 3,
        probabilidades: { positivo: 0, negativo: 0, neutro: 1 },
        urgency: 'low',
      };
    }
  }

  private async callGemini(prompt: string, maxTokens = 700): Promise<string> {
    if (!this.GEMINI_API_KEY) {
      return 'Resumen no disponible: agrega GEMINI_API_KEY al archivo .env';
    }

    try {
      const genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY);

      const model = genAI.getGenerativeModel({ model: this.GEMINI_MODEL });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      });

      return result.response.text();
    } catch (error) {
      this.logger.error(
        `Error llamando a Gemini SDK: ${(error as Error).message}`,
      );
      return 'Error al generar el resumen con IA.';
    }
  }

  async generateWeeklySummary(
    businessName: string,
    stats: WeeklySummaryStatsDto,
    topComments: ReviewSampleDto[],
  ): Promise<string> {
    const pctPos =
      stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
    const pctNeg =
      stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0;
    const pctNeu =
      stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0;

    const trendLabel =
      stats.trend === 'improving'
        ? '📈 Mejorando'
        : stats.trend === 'declining'
          ? '📉 Empeorando'
          : '➡️ Estable';

    const sampleText = topComments
      .slice(0, 10)
      .map((c) => `[${c.sentiment} ${c.rating}★] ${c.comment}`)
      .join('\n');

    const prompt = `Eres un analista de experiencia de cliente para EcoVida, plataforma de negocios sostenibles.

Negocio: "${businessName}"
Período: últimos 7 días

ESTADÍSTICAS DE LA SEMANA:
- Total reseñas: ${stats.total}
- Positivas: ${stats.positive} (${pctPos}%)
- Neutrales: ${stats.neutral} (${pctNeu}%)
- Negativas: ${stats.negative} (${pctNeg}%)
- Calificación promedio: ${stats.averageRating.toFixed(2)} ★
- Tendencia: ${trendLabel}

MUESTRA DE RESEÑAS RECIENTES:
${sampleText}

Genera el reporte semanal en español con este formato exacto:

**Resumen ejecutivo**
[2 oraciones que capturen la semana]

**Puntos fuertes mencionados**
- [punto 1]
- [punto 2]
- [punto 3]

**Áreas de mejora identificadas**
- [área 1]
- [área 2]

**Recomendación para la próxima semana**
[1 acción concreta y alcanzable]

Máximo 200 palabras. Tono profesional pero accesible.`;

    return this.callGemini(prompt, 700);
  }

  async generateGeneralReview(
    businessName: string,
    allReviews: ReviewSampleDto[],
  ): Promise<string> {
    if (allReviews.length === 0)
      return 'Sin reseñas disponibles para generar resumen.';

    const total = allReviews.length;
    const avgRating = (
      allReviews.reduce((s, r) => s + r.rating, 0) / total
    ).toFixed(2);
    const positive = allReviews.filter(
      (r) => r.sentiment === 'Positive',
    ).length;
    const negative = allReviews.filter(
      (r) => r.sentiment === 'Negative',
    ).length;
    const neutral = allReviews.filter((r) => r.sentiment === 'Neutral').length;

    const sample = allReviews.slice(0, 30);
    const sampleText = sample
      .map((c) => `[${c.sentiment} ${c.rating}★] ${c.comment}`)
      .join('\n');

    const prompt = `Eres un sistema de síntesis de reseñas para EcoVida, plataforma de negocios sostenibles.

Negocio: "${businessName}"
Datos: ${total} reseñas | Promedio: ${avgRating}★ | ${positive} positivas · ${neutral} neutras · ${negative} negativas

RESEÑAS (muestra de ${sample.length}):
${sampleText}

Genera un resumen MUY CORTO al estilo de Mercado Libre: directo, escaneable, útil para decidir en segundos.

Formato obligatorio (respeta exactamente este esquema):
Lo que más destacan: [máximo 10 palabras con los 2 puntos fuertes]
Lo que más critican: [máximo 10 palabras con el principal problema, o "Sin quejas frecuentes" si no hay]
En resumen: [1 sola frase de máximo 20 palabras con la impresión general]

Reglas:
- Máximo 50 palabras en total
- Sin introducciones ni cierres
- Sin inventar datos que no estén en las reseñas`;

    return this.callGemini(prompt, 180);
  }
}
