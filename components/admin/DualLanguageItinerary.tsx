'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from './RichTextEditor';
import { Plus, X } from 'lucide-react';

interface ItineraryItem {
  day: number;
  time: string;
  activity: string;
}

interface DualLanguageItineraryProps {
  itineraryEn: ItineraryItem[];
  itineraryZh: ItineraryItem[];
  onChangeEn: (items: ItineraryItem[]) => void;
  onChangeZh: (items: ItineraryItem[]) => void;
  t: (key: string) => string;
}

export function DualLanguageItinerary({
  itineraryEn,
  itineraryZh,
  onChangeEn,
  onChangeZh,
  t,
}: DualLanguageItineraryProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'zh'>('en');

  const addItem = () => {
    const newItem = { day: 1, time: '', activity: '' };
    if (activeTab === 'en') {
      onChangeEn([...itineraryEn, newItem]);
    } else {
      onChangeZh([...itineraryZh, newItem]);
    }
  };

  const removeItem = (index: number) => {
    if (activeTab === 'en') {
      onChangeEn(itineraryEn.filter((_, i) => i !== index));
    } else {
      onChangeZh(itineraryZh.filter((_, i) => i !== index));
    }
  };

  const updateItem = <K extends keyof ItineraryItem>(
    index: number,
    field: K,
    value: ItineraryItem[K]
  ) => {
    if (activeTab === 'en') {
      const updated = [...itineraryEn];
      updated[index][field] = value;
      onChangeEn(updated);
    } else {
      const updated = [...itineraryZh];
      updated[index][field] = value;
      onChangeZh(updated);
    }
  };

  const currentItinerary = activeTab === 'en' ? itineraryEn : itineraryZh;
  const hasZhContent = itineraryZh.some(item => item.activity);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('itinerary')}</CardTitle>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addItineraryItem')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'zh')} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="en" className="relative">
              English
              {itineraryEn.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">
                  {itineraryEn.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="zh" className="relative">
              中文
              {hasZhContent && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
              {itineraryZh.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">
                  {itineraryZh.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {currentItinerary.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground text-center">
                  {activeTab === 'en'
                    ? t('noItineraryItems')
                    : '尚未添加中文行程项目'
                  }
                </p>
              </div>
            ) : (
              currentItinerary.map((item, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Day Field */}
                      <div className="space-y-2">
                        <Label htmlFor={`${activeTab}-day-${index}`}>
                          {t('day')}
                        </Label>
                        <Input
                          id={`${activeTab}-day-${index}`}
                          type="number"
                          min={1}
                          value={item.day.toString()}
                          onChange={(e) => updateItem(index, 'day', Number(e.target.value))}
                        />
                      </div>
                      {/* Time Field */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`${activeTab}-time-${index}`}>
                          {t('time')}{' '}
                          <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Input
                          id={`${activeTab}-time-${index}`}
                          placeholder={activeTab === 'en'
                            ? "e.g., 02:00 AM or leave empty"
                            : "例如：上午 02:00 或留空"
                          }
                          value={item.time || ''}
                          onChange={(e) => updateItem(index, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                    {/* Activity Field */}
                    <div className="space-y-2">
                      <Label htmlFor={`${activeTab}-activity-${index}`}>
                        {t('activity')}
                      </Label>
                      <RichTextEditor
                        content={item.activity}
                        onChange={(html) => updateItem(index, 'activity', html)}
                        placeholder={activeTab === 'en'
                          ? "e.g., Hotel pickup, breakfast at the lodge, guided tour..."
                          : "例如：酒店接送、旅馆早餐、导游带领参观..."
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="mt-5"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
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
