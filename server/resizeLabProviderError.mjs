// Expose provider reasons, never credentials or echoed image/prompt payloads.
export async function resizeLabProviderError(response){
 let payload;try{payload=await response.json();}catch{}
 const error=payload?.error,source=error?.metadata?.limit_source;
 const clean=value=>String(value||'').replace(/sk-or-[\w-]+/gi,'[redacted]').replace(/Bearer\s+\S+/gi,'Bearer [redacted]').replace(/data:[^\s"']+/gi,'[image]').slice(0,600);
 const message=typeof error?.message==='string'?clean(error.message):'';
 const reason=source==='openrouter_key_limit'?'Исчерпан лимит расходов API-ключа.':source==='openrouter_in_flight_budget'?'Достигнут временный бюджет активных запросов.':source==='openrouter_credits'?'OpenRouter отклонил предварительную проверку доступных кредитов для этого запроса.':response.status===402?'OpenRouter отклонил оплату запроса. Один код 402 не определяет, исчерпан ли баланс или другой лимит.':'OpenRouter отклонил запрос.';
 return {error:`${reason} HTTP ${response.status}.${message?` Ответ провайдера: ${message}`:''} Результат не применён.`,providerError:{status:response.status,...(source?{limitSource:clean(source)}:{}),...(message?{message}:{}),...(response.headers?.get?.('retry-after')?{retryAfter:clean(response.headers.get('retry-after'))}:{})}};
}
