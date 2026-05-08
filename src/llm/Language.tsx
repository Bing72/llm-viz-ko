'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import generatedEnglishData from './locales/walkthroughEnglish.generated.json';

export type LlmLanguage = 'en' | 'ko';

interface ILanguageContext {
    language: LlmLanguage;
    setLanguage: (language: LlmLanguage) => void;
}

const LanguageContext = createContext<ILanguageContext>({
    language: 'ko',
    setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let [language, setLanguageState] = useState<LlmLanguage>('ko');

    useEffect(() => {
        let stored = window.localStorage.getItem('llm-language');
        if (stored === 'en' || stored === 'ko') {
            setLanguageState(stored);
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    function setLanguage(next: LlmLanguage) {
        setLanguageState(next);
        window.localStorage.setItem('llm-language', next);
    }

    let value = useMemo(() => ({ language, setLanguage }), [language]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
    return useContext(LanguageContext);
}

export function localizedLabel(language: LlmLanguage, en: string, ko: string) {
    return language === 'en' ? en : ko;
}

interface IEnglishLocalizationData {
    templates: {
        key: string[];
        en: string[];
        valueOrder: number[];
    }[];
    text: [string, string][];
}

const englishData = generatedEnglishData as IEnglishLocalizationData;
const englishTemplateMap = new Map(englishData.templates.map(entry => [templateKey(entry.key), entry]));
const englishTextMap = new Map(englishData.text);

function normalizeText(text: string) {
    return text.replace(/\s+/g, ' ').trim();
}

function templateKey(strings: readonly string[]) {
    return JSON.stringify(strings.map(normalizeText));
}

function replacePreservingOuterWhitespace(original: string, replacement: string) {
    let leading = original.match(/^\s*/)?.[0] ?? '';
    let trailing = original.match(/\s*$/)?.[0] ?? '';
    return `${leading}${replacement}${trailing}`;
}

export function localizeTemplateStrings(strings: readonly string[], language: LlmLanguage) {
    return localizeTemplate(strings, language).strings;
}

export function localizeTemplate(strings: readonly string[], language: LlmLanguage) {
    if (language === 'ko') {
        return { strings };
    }

    let mapped = englishTemplateMap.get(templateKey(strings));
    if (mapped) {
        return { strings: mapped.en, valueOrder: mapped.valueOrder };
    }

    return { strings: strings.map(text => localizeText(text, language)) };
}

export function localizeText(text: string, language: LlmLanguage) {
    if (language === 'ko') {
        return text;
    }

    let normalized = normalizeText(text);
    let mapped = englishTextMap.get(normalized);
    if (mapped) {
        return replacePreservingOuterWhitespace(text, mapped);
    }

    switch (normalized) {
        case '소개': return 'Introduction';
        case '개요': return 'Overview';
        case '사전 지식': return 'Preliminary';
        case '상세 과정': return 'Detailed';
        case '임베딩': return 'Embedding';
        case '레이어 정규화': return 'Layer Norm';
        case '셀프 어텐션': return 'Self Attention';
        case '프로젝션': return 'Projection';
        case '트랜스포머': return 'Transformer';
        case '소프트맥스': return 'Softmax';
        case '출력': return 'Output';
        default: return text;
    }
}

export function localizeReactNode(node: React.ReactNode, language: LlmLanguage): React.ReactNode {
    if (language === 'ko') {
        return node;
    }

    if (typeof node === 'string') {
        return localizeText(node, language);
    }

    if (Array.isArray(node)) {
        return node.map((child, index) => <React.Fragment key={index}>{localizeReactNode(child, language)}</React.Fragment>);
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
        let children = node.props.children;
        if (children === undefined) {
            return node;
        }
        return React.cloneElement(node, undefined, React.Children.map(children, child => localizeReactNode(child, language)));
    }

    return node;
}

export const LanguageToggle: React.FC = () => {
    let { language, setLanguage } = useLanguage();

    return <div className="flex items-center overflow-hidden rounded border border-white/40 text-sm leading-none">
        <button
            className={`px-2 py-1 ${language === 'en' ? 'bg-white text-blue-950' : 'text-white hover:bg-white/10'}`}
            onClick={() => setLanguage('en')}
            type="button"
        >
            en
        </button>
        <button
            className={`px-2 py-1 ${language === 'ko' ? 'bg-white text-blue-950' : 'text-white hover:bg-white/10'}`}
            onClick={() => setLanguage('ko')}
            type="button"
        >
            ko
        </button>
    </div>;
};
