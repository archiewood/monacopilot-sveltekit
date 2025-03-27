import {json} from '@sveltejs/kit';
import type {RequestHandler} from '@sveltejs/kit';
import {MISTRALAI_API_KEY} from '$env/static/private';
import {CompletionCopilot, type CompletionRequestBody} from 'monacopilot';

const copilot = new CompletionCopilot(MISTRALAI_API_KEY, {
    provider: 'mistral',
    model: 'codestral',
});

export const POST: RequestHandler = async ({request}) => {
    const body: CompletionRequestBody = await request.json();
    const completion = await copilot.complete({body});
    return json(completion);
}; 