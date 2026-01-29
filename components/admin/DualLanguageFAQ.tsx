'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface DualLanguageFAQProps {
  faqsEn: FAQItem[];
  faqsZh: FAQItem[];
  onChangeEn: (items: FAQItem[]) => void;
  onChangeZh: (items: FAQItem[]) => void;
  t: (key: string) => string;
}

export function DualLanguageFAQ({
  faqsEn,
  faqsZh,
  onChangeEn,
  onChangeZh,
  t,
}: DualLanguageFAQProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'zh'>('en');

  const addItem = () => {
    const newItem = { question: '', answer: '' };
    if (activeTab === 'en') {
      onChangeEn([...faqsEn, newItem]);
    } else {
      onChangeZh([...faqsZh, newItem]);
    }
  };

  const removeItem = (index: number) => {
    if (activeTab === 'en') {
      onChangeEn(faqsEn.filter((_, i) => i !== index));
    } else {
      onChangeZh(faqsZh.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof FAQItem, value: string) => {
    if (activeTab === 'en') {
      const updated = [...faqsEn];
      updated[index][field] = value;
      onChangeEn(updated);
    } else {
      const updated = [...faqsZh];
      updated[index][field] = value;
      onChangeZh(updated);
    }
  };

  const currentFaqs = activeTab === 'en' ? faqsEn : faqsZh;
  const hasZhContent = faqsZh.some(item => item.question || item.answer);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('faqs')}</CardTitle>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addFaq')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'zh')} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="en" className="relative">
              English
              {faqsEn.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">
                  {faqsEn.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="zh" className="relative">
              中文
              {hasZhContent && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
              {faqsZh.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">
                  {faqsZh.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {currentFaqs.map((item, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <Label htmlFor={`${activeTab}-faq-question-${index}`}>
                    {activeTab === 'en' ? `FAQ #${index + 1}` : `常见问题 #${index + 1}`}
                  </Label>
                  {currentFaqs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${activeTab}-faq-question-${index}`}>
                    {t('question')}
                  </Label>
                  <Input
                    id={`${activeTab}-faq-question-${index}`}
                    placeholder={activeTab === 'en'
                      ? t('faqQuestionPlaceholder')
                      : '例如：这次旅行包括餐食吗？'
                    }
                    value={item.question}
                    onChange={(e) => updateItem(index, 'question', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${activeTab}-faq-answer-${index}`}>
                    {t('answer')}
                  </Label>
                  <Textarea
                    id={`${activeTab}-faq-answer-${index}`}
                    placeholder={activeTab === 'en'
                      ? t('faqAnswerPlaceholder')
                      : '输入答案...'
                    }
                    rows={3}
                    value={item.answer}
                    onChange={(e) => updateItem(index, 'answer', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {activeTab === 'zh' && !hasZhContent && (
          <p className="text-xs text-muted-foreground">
            可选：留空以显示英文版本作为后备
          </p>
        )}
      </CardContent>
    </Card>
  );
}
