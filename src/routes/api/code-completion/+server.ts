import {json} from '@sveltejs/kit';
import type {RequestHandler} from '@sveltejs/kit';
import {MISTRALAI_API_KEY, OPENAI_API_KEY} from '$env/static/private';
const configCompact = await import('$lib/files/config-compact.json');
const tables = await import('$lib/files/tables.json');

interface CompletionRequest {
    position: {
        lineNumber: number;
        column: number;
    };
    text: string;
    includeTables?: boolean;
    includeComponents?: boolean;
    model: 'mistral' | 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview';
}

async function callOpenAI(prefix: string, suffix: string, model: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [{
                role: 'user',
                content: `Complete the following code. Only provide the completion, no explanations:
PREFIX:
${prefix}

SUFFIX:
${suffix}`
            }],
            max_tokens: 200,
            temperature: 0
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

async function callMistral(prefix: string, suffix: string) {
    const response = await fetch('https://api.mistral.ai/v1/fim/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRALAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'codestral-latest',
            prompt: prefix,
            suffix: suffix,
            max_tokens: 200,
            temperature: 0
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mistral API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

export const POST: RequestHandler = async ({request}) => {
    const startTime = Date.now();
    console.log('🕒 Starting completion request...');
    const body: CompletionRequest = await request.json();

    const instruction = `<instruction>
Complete the markdown in the given context. You may use markdoc components.

${body.includeTables ? `Available Tables:
${JSON.stringify(tables.tables, null, 2)}

` : ''}${body.includeComponents ? `Available Components:
${JSON.stringify(configCompact, null, 2)}

` : ''}Examples: 
{% bar_chart
  data="order_details"
  x="date"
  y="amount"
%}
{% table
  data="order_details"
%}
{% markdown %}
# Hello World
{% endmarkdown %}
</instruction>\n`;

    console.log(body.text);

    // Split text into lines for easier handling
    const lines = body.text.split('\n');
    
    // Get text before cursor (including the current line up to cursor)
    const prefix = instruction + lines.slice(0, body.position.lineNumber - 1).join('\n') + 
        (body.position.lineNumber > 0 ? '\n' + lines[body.position.lineNumber - 1].slice(0, body.position.column - 1) : '');
    
    // Get text from cursor position onwards
    const suffix = lines[body.position.lineNumber - 1].slice(body.position.column - 1) +
        (body.position.lineNumber < lines.length ? '\n' + lines.slice(body.position.lineNumber).join('\n') : '');

    try {
        console.log(`📤 Sending request to ${body.model} API...`);
        const apiStartTime = Date.now();
        
        let completion;
        if (body.model === 'mistral') {
            completion = await callMistral(prefix, suffix);
        } else {
            completion = await callOpenAI(prefix, suffix, body.model);
        }

        const apiTime = Date.now() - apiStartTime;
        console.log(`✅ ${body.model} API response received in ${apiTime}ms`);
        
        const completionTime = Date.now() - startTime;
        console.log(`🏁 Total request completed in ${completionTime}ms`);
        
        return json({
            completion,
            timing: {
                totalServerTime: completionTime,
                apiTime: apiTime
            },
            metrics: {
                prefixLength: prefix.length,
                suffixLength: suffix.length,
                completionLength: completion.length,
                model: body.model
            }
        });
    } catch (error) {
        console.error(`❌ Error calling ${body.model} API:`, error);
        const errorTime = Date.now() - startTime;
        console.log(`⚠️ Request failed after ${errorTime}ms`);
        return json({
            completion: null,
            timing: {
                totalServerTime: errorTime,
                error: true
            },
            metrics: {
                prefixLength: prefix.length,
                suffixLength: suffix.length,
                completionLength: 0,
                model: body.model
            }
        });
    }
}; 