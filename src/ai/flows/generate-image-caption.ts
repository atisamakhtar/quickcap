'use server';

/**
 * @fileOverview Generates social media captions for an image based on specified parameters like number of captions, tone, language, and inclusion of hashtags/emojis.
 *
 * - generateImageCaption - A function that handles the image caption generation process.
 * - GenerateImageCaptionInput - The input type for the generateImageCaption function.
 * - GenerateImageCaptionOutput - The return type for the generateImageCaption function.
 * - CaptionWithTone - The type for a single caption object including its tone.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageCaptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  numberOfCaptions: z.number().min(1).max(5).default(3).describe("The number of captions to generate."),
  writingTone: z.string().default('Casual').describe("The desired tone for the captions (e.g., Casual, Professional, Fun, Witty, Engaging)."),
  includeHashtags: z.boolean().default(true).describe("Whether to include hashtags in the captions."),
  includeEmojis: z.boolean().default(true).describe("Whether to include emojis in the captions."),
  language: z.string().default('English').describe("The language for the generated captions."),
});
export type GenerateImageCaptionInput = z.infer<typeof GenerateImageCaptionInputSchema>;

const CaptionWithToneSchema = z.object({
  tone: z.string().describe("The tone of the caption (e.g., Professional, Casual, Witty). This should match the input writingTone."),
  text: z.string().describe("The generated caption text."),
});
export type CaptionWithTone = z.infer<typeof CaptionWithToneSchema>;

const GenerateImageCaptionOutputSchema = z.object({
  captions: z.array(CaptionWithToneSchema)
    .describe("An array of generated captions, each with the specified tone."),
});
export type GenerateImageCaptionOutput = z.infer<typeof GenerateImageCaptionOutputSchema>;

export async function generateImageCaption(
  input: GenerateImageCaptionInput
): Promise<GenerateImageCaptionOutput> {
  return generateImageCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageCaptionPrompt',
  input: {schema: GenerateImageCaptionInputSchema},
  output: {schema: GenerateImageCaptionOutputSchema},
  prompt: `You are an AI social media expert. For the provided image, generate {{numberOfCaptions}} distinct, engaging caption(s).
Each caption must adhere to a "{{writingTone}}" tone.
The language for the captions should be {{language}}.
Each caption should be between 10 and 50 words.

{{#if includeHashtags}}
Each caption should include 2-4 relevant hashtags.
{{else}}
Do not include hashtags in the captions.
{{/if}}

{{#if includeEmojis}}
Feel free to use relevant emojis to make the captions more engaging.
{{else}}
Do not include emojis in the captions.
{{/if}}

Focus on making each post appealing and likely to get engagement (likes, shares, comments) according to its tone.

Return the output as a JSON object with a single key "captions".
"captions" should be an array of objects. The number of objects in the array must be exactly {{numberOfCaptions}}.
Each object in the array must have two keys:
1.  "tone": A string representing the tone. This value MUST be "{{writingTone}}".
2.  "text": A string containing the generated caption text ({{#if includeHashtags}}with hashtags if requested{{/if}}{{#if includeEmojis}}, and emojis if requested{{/if}}).

Image: {{media url=photoDataUri}}`,
});

const generateImageCaptionFlow = ai.defineFlow(
  {
    name: 'generateImageCaptionFlow',
    inputSchema: GenerateImageCaptionInputSchema,
    outputSchema: GenerateImageCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.captions || output.captions.length !== input.numberOfCaptions) {
      console.error("AI did not return the expected caption structure or count:", output);
      // Attempt to normalize if the count is off but content exists
      if (output && output.captions && output.captions.length > 0 && output.captions.length !== input.numberOfCaptions) {
        // If more captions are returned than requested, truncate them.
        // If fewer, this will be caught as an error.
        // This is a simple fix; more robust logic might involve retries or default values.
        output.captions = output.captions.slice(0, input.numberOfCaptions);
        if (output.captions.length !== input.numberOfCaptions) {
           throw new Error(`Failed to generate the requested number of captions. Expected ${input.numberOfCaptions}, got ${output.captions.length}.`);
        }
      } else {
        throw new Error(`Failed to generate captions in the expected format. Expected ${input.numberOfCaptions} captions.`);
      }
    }
     // Ensure all captions have the correct tone as per the input
    output.captions.forEach(caption => {
        if (caption.tone !== input.writingTone) {
            // Correct the tone if the LLM deviates. This reinforces the output structure.
            console.warn(`AI returned caption with tone "${caption.tone}" but expected "${input.writingTone}". Correcting.`);
            caption.tone = input.writingTone;
        }
    });
    return output;
  }
);