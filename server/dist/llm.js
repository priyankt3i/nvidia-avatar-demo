export async function generateReply(userText) {
    if (process.env.GEMINI_API_KEY) {
        try {
            const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: userText }] }
                    ]
                }),
            });
            if (res.ok) {
                const json = await res.json();
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (text)
                    return text;
            }
        }
        catch { }
    }
    if (process.env.OPENAI_API_KEY) {
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a helpful, concise assistant speaking to a user via an animated avatar.' },
                        { role: 'user', content: userText },
                    ],
                    temperature: 0.6,
                    max_tokens: 200,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                const content = json.choices?.[0]?.message?.content?.trim();
                if (content)
                    return content;
            }
        }
        catch { }
    }
    return `You said: "${userText}". Here's a friendly response from the mock assistant.`;
}
