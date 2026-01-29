'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';

interface DualLanguageInputProps {
  label: string;
  id: string;
  type?: 'text' | 'textarea' | 'richtext';
  valueEn: string;
  valueZh: string;
  onChangeEn: (value: string) => void;
  onChangeZh: (value: string) => void;
  placeholder?: string;
  placeholderZh?: string;
  required?: boolean;
  rows?: number;
}

export function DualLanguageInput({
  label,
  id,
  type = 'text',
  valueEn,
  valueZh,
  onChangeEn,
  onChangeZh,
  placeholder,
  placeholderZh,
  required = false,
  rows = 4,
}: DualLanguageInputProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'zh'>('en');

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'en' | 'zh')} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="en" className="relative">
            English
            {required && !valueEn && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="zh" className="relative">
            中文
            {valueZh && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="mt-2">
          {type === 'text' && (
            <Input
              id={id}
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholder}
              required={required}
            />
          )}
          {type === 'textarea' && (
            <Textarea
              id={id}
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholder}
              required={required}
              rows={rows}
            />
          )}
          {type === 'richtext' && (
            <RichTextEditor
              content={valueEn}
              onChange={onChangeEn}
              placeholder={placeholder}
            />
          )}
        </TabsContent>

        <TabsContent value="zh" className="mt-2">
          {type === 'text' && (
            <Input
              id={`${id}-zh`}
              value={valueZh}
              onChange={(e) => onChangeZh(e.target.value)}
              placeholder={placeholderZh || placeholder}
            />
          )}
          {type === 'textarea' && (
            <Textarea
              id={`${id}-zh`}
              value={valueZh}
              onChange={(e) => onChangeZh(e.target.value)}
              placeholder={placeholderZh || placeholder}
              rows={rows}
            />
          )}
          {type === 'richtext' && (
            <RichTextEditor
              content={valueZh}
              onChange={onChangeZh}
              placeholder={placeholderZh || placeholder}
            />
          )}
        </TabsContent>
      </Tabs>

      {activeTab === 'zh' && !valueZh && (
        <p className="text-xs text-muted-foreground">
          Optional: Leave empty to show English version as fallback
        </p>
      )}
    </div>
  );
}
