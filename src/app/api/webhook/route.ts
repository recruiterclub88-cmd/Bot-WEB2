import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Received Green API Webhook:', JSON.stringify(body, null, 2));

        // Green API отправляет разные типы уведомлений. Нас интересует incomingMessageReceived
        if (body.typeWebhook === 'incomingMessageReceived') {
            const chatId = body.senderData.chatId;
            const messageText = body.messageData.textMessageData?.textMessage || '';

            if (!messageText) return NextResponse.json({ ok: true });

            // 1. Получаем настройки (системный промпт)
            const { data: settings } = await supabase
                .from('settings')
                .select('system_prompt')
                .single();

            const systemPrompt = settings?.system_prompt || 'Ты — полезный ассистент.';

            // 2. Получаем историю переписки из Supabase (последние 10 сообщений)
            const { data: history } = await supabase
                .from('chat_history')
                .select('*')
                .order('created_at', { ascending: false })
                .eq('chat_id', chatId)
                .limit(10);

            // Форматируем историю для Gemini (он принимает массив в обратном порядке от новых к старым обычно, 
            // но в API мы передаем всё сообщение сразу или через чат-сессию)
            const formattedHistory = (history || [])
                .reverse()
                .map((msg: any) => ({
                    role: msg.role === 'model' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                }));

            // 3. Генерируем ответ через Gemini
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: systemPrompt
            });

            const chat = model.startChat({
                history: formattedHistory,
            });

            const result = await chat.sendMessage(messageText);
            const responseText = result.response.text();

            // 4. Сохраняем в базу (сообщение пользователя и ответ бота)
            await supabase.from('chat_history').insert([
                { chat_id: chatId, role: 'user', content: messageText },
                { chat_id: chatId, role: 'model', content: responseText }
            ]);

            // 5. Отправляем ответ через Green API
            await sendWhatsAppMessage(chatId, responseText);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function sendWhatsAppMessage(chatId: string, text: string) {
    const idInstance = process.env.GREEN_API_ID_INSTANCE;
    const apiToken = process.env.GREEN_API_TOKEN;
    const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: text }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Green API Send Error:', errorText);
    }
}
