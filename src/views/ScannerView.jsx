import React, { useRef, useState } from 'react';
import { IconCamera } from '../components/icons';

export default function ScannerView({
  theme,
  aiConfig,
  addTransaction,
  formatCurrency,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const normalizeReceiptToTransaction = (extractedData) => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const rawDate = extractedData.date ? String(extractedData.date).trim() : '';
    const parsed = rawDate ? new Date(rawDate) : null;

    const isValidDate = parsed && !Number.isNaN(parsed.getTime());
    const isCurrentMonth =
      isValidDate &&
      parsed.getFullYear() === today.getFullYear() &&
      parsed.getMonth() === today.getMonth();

    return {
      type: 'expense',
      amount: Number(extractedData.total) || 0,
      merchant: extractedData.merchant || 'Unknown',
      date: isCurrentMonth ? parsed.toISOString().split('T')[0] : todayIso,
      originalReceiptDate: rawDate || null,
      category: extractedData.category || 'Uncategorized',
    };
  };

  const tryDeepSeekFromOcrText = async (ocrText) => {
    const payload = {
      model: aiConfig.chatModel,
      messages: [
        {
          role: 'system',
          content:
            'You extract receipt data from OCR text. Return only valid JSON with keys: merchant (string), total (number), date (YYYY-MM-DD), category (string). If uncertain, make the safest reasonable guess.',
        },
        {
          role: 'user',
          content: `Extract structured receipt data from this OCR text:\n\n${ocrText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    };

    const response = await fetch(aiConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let details = '';
      try {
        const errorBody = await response.json();
        details = errorBody?.error?.message || errorBody?.message || JSON.stringify(errorBody);
      } catch {
        details = await response.text();
      }
      throw new Error(`OCR parse via ${aiConfig.chatModel} failed: ${response.status}${details ? ` - ${details}` : ''}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    const text = typeof content === 'string' ? content : '';
    if (!text) {
      throw new Error('OCR parse returned empty response content.');
    }

    const cleanedText = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanedText);
  };

  const runLocalOcr = async (file) => {
    const { recognize } = await import('tesseract.js');
    const result = await recognize(file, 'eng');
    const ocrText = result?.data?.text?.trim() || '';

    if (!ocrText) {
      throw new Error('OCR could not read text from this image.');
    }

    return ocrText;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setError('');
    setSuccessMsg('');

    if (!aiConfig.apiKey) {
      setError('Missing DeepSeek API key. Add your key in App AI config first.');
      setIsScanning(false);
      return;
    }

    try {
      const reader = new FileReader();

      reader.onerror = () => {
        setError('Could not read the selected image. Please try another file.');
        setIsScanning(false);
      };

      reader.onloadend = async () => {
        try {
          const candidateModels = [aiConfig.visionModel, aiConfig.visionFallbackModel].filter(Boolean);

          const uniqueModels = [...new Set(candidateModels)];

          let text = '';
          const modelErrors = [];

          for (const model of uniqueModels) {
            const payload = {
              model,
              messages: [
                {
                  role: 'system',
                  content:
                    'You extract receipt data. Return only valid JSON with keys: merchant (string), total (number), date (YYYY-MM-DD), category (string).',
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text:
                        'Analyze this receipt image and extract merchant, total, date, and best budget category (Groceries, Dining, Transport, Utilities, Housing, Health, Entertainment, Uncategorized).',
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: reader.result,
                      },
                    },
                  ],
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0,
            };

            const response = await fetch(aiConfig.apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${aiConfig.apiKey}`,
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              let details = '';
              try {
                const errorBody = await response.json();
                details = errorBody?.error?.message || errorBody?.message || JSON.stringify(errorBody);
              } catch {
                details = await response.text();
              }
              modelErrors.push(`Model ${model}: ${response.status}${details ? ` - ${details}` : ''}`);
              continue;
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;
            text = typeof content === 'string' ? content : '';
            if (text) break;

            modelErrors.push(`Model ${model}: empty response content.`);
          }

          if (!text) {
            const combinedError = modelErrors.join(' | ') || 'No usable response from DeepSeek vision models.';

            const needsTextFallback = combinedError.includes('unknown variant `image_url`, expected `text`');
            if (!needsTextFallback) {
              throw new Error(combinedError);
            }

            const ocrText = await runLocalOcr(file);
            const extractedFromOcr = await tryDeepSeekFromOcrText(ocrText);
            addTransaction(normalizeReceiptToTransaction(extractedFromOcr));
            setSuccessMsg(
              `Logged via OCR fallback: ${extractedFromOcr.merchant || 'Unknown'} for ${formatCurrency(Number(extractedFromOcr.total) || 0)}`
            );
            return;
          }

          if (text) {
            const cleanedText = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
            const extractedData = JSON.parse(cleanedText);
            addTransaction(normalizeReceiptToTransaction(extractedData));
            setSuccessMsg(`Successfully logged: ${extractedData.merchant} for ${formatCurrency(extractedData.total || 0)}`);
          } else {
            setError('Could not read receipt data.');
          }
        } catch (err) {
          console.error(err);
          setError(`Scanning failed: ${err.message || 'Please try another receipt image.'}`);
        } finally {
          setIsScanning(false);
          event.target.value = '';
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('An error occurred while scanning.');
      setIsScanning(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 h-full flex flex-col">
      <header>
        <h2 className={`text-2xl font-bold ${theme.text}`}>AI Receipt Scanner</h2>
        <p className={`${theme.textMuted} text-sm`}>Upload a receipt to automatically log the expense.</p>
      </header>

      <div className={`flex-1 ${theme.card} rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[300px]`}>
        {isScanning ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <h3 className={`text-lg font-semibold ${theme.text}`}>Analyzing AI Data...</h3>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-6"><IconCamera /></div>
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>Upload Receipt</h3>
            <p className={`${theme.textMuted} mb-6 max-w-sm`}>Take a photo or upload an image. We'll extract the merchant, total, and categorize it automatically.</p>

            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              Select Image
            </button>
          </>
        )}

        {error && <div className="mt-6 p-4 bg-rose-500/10 text-rose-500 rounded-xl max-w-md w-full">{error}</div>}
        {successMsg && <div className="mt-6 p-4 bg-emerald-500/10 text-emerald-500 rounded-xl max-w-md w-full font-medium">{successMsg}</div>}
      </div>
    </div>
  );
}
