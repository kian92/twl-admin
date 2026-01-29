'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

interface DualLanguageArrayInputProps {
  label: string;
  id: string;
  valuesEn: string[];
  valuesZh: string[];
  onChangeEn: (values: string[]) => void;
  onChangeZh: (values: string[]) => void;
  placeholderEn?: string;
  placeholderZh?: string;
}

export function DualLanguageArrayInput({
  label,
  id,
  valuesEn,
  valuesZh,
  onChangeEn,
  onChangeZh,
  placeholderEn = 'Press Enter to add',
  placeholderZh = '按 Enter 添加',
}: DualLanguageArrayInputProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'zh'>('en');

  const addItem = (value: string) => {
    if (!value.trim()) return;
    if (activeTab === 'en') {
      onChangeEn([...valuesEn, value.trim()]);
    } else {
      onChangeZh([...valuesZh, value.trim()]);
    }
  };

  const removeItem = (index: number) => {
    if (activeTab === 'en') {
      onChangeEn(valuesEn.filter((_, i) => i !== index));
    } else {
      onChangeZh(valuesZh.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, value: string) => {
    if (activeTab === 'en') {
      const updated = [...valuesEn];
      updated[index] = value;
      onChangeEn(updated);
    } else {
      const updated = [...valuesZh];
      updated[index] = value;
      onChangeZh(updated);
    }
  };

  const currentValues = activeTab === 'en' ? valuesEn : valuesZh;
  const hasZhContent = valuesZh.some(item => item.trim());

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-${activeTab}`}>{label}</Label>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'zh')} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="en" className="relative">
            English
            {valuesEn.length > 0 && (
              <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">
                {valuesEn.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="zh" className="relative">
            中文
            {hasZhContent && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
            {valuesZh.length > 0 && (
              <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded">
                {valuesZh.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-2 space-y-2">
          {currentValues.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={activeTab === 'en' ? placeholderEn : placeholderZh}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Input
            id={`${id}-${activeTab}`}
            placeholder={activeTab === 'en' ? placeholderEn : placeholderZh}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.currentTarget.value;
                addItem(value);
                e.currentTarget.value = '';
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {activeTab === 'zh' && !hasZhContent && (
        <p className="text-xs text-muted-foreground">
          可选：留空以显示英文版本作为后备
        </p>
      )}
    </div>
  );
}
