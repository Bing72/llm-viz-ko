'use client';

import React from 'react';
import { Header } from '@/src/homepage/Header';
import { LayerView } from '@/src/llm/LayerView';
import { InfoButton } from '@/src/llm/WelcomePopup';
import { LanguageProvider, LanguageToggle, localizedLabel, useLanguage } from '@/src/llm/Language';

const LlmPageInner: React.FC = () => {
    let { language } = useLanguage();

    return <>
        <Header
            title={localizedLabel(language, 'LLM Visualization', 'LLM 시각화')}
            right={<LanguageToggle />}
        >
            <InfoButton />
        </Header>
        <LayerView />
        <div id="portal-container"></div>
    </>;
};

export const LlmPageClient: React.FC = () => {
    return <LanguageProvider>
        <LlmPageInner />
    </LanguageProvider>;
};
