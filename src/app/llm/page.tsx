import React from 'react';
import { LlmPageClient } from '@/src/llm/LlmPageClient';

export const metadata = {
  title: 'LLM Visualization / LLM 시각화',
  description: 'A 3D interactive walkthrough of how an LLM works. LLM이 동작하는 과정을 단계별로 살펴보는 3D 인터랙티브 시각화입니다.',
};

export default function Page() {
    return <LlmPageClient />;
}
