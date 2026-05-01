'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

export function localizeText(text: string, language: LlmLanguage) {
    if (language === 'ko') {
        return text;
    }

    let normalized = text.replace(/\s+/g, ' ').trim();
    let mapped = walkthroughEnglish.get(normalized) ?? inlineEnglish.get(normalized);
    if (mapped) {
        return text.replace(text.trim(), mapped);
    }

    switch (text) {
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

const inlineEnglish = new Map<string, string>([
    ["_토큰_", "_token_"],
    ["_토큰 인덱스_", "_token index_"],
    ["_임베딩(embedding)_", "_embedding_"],
    ["_입력 임베딩(input embedding)_", "_input embedding_"],
    ["_입력 임베딩_", "_input embedding_"],
    ["_토큰 임베딩 행렬(token embedding matrix)_", "_token embedding matrix_"],
    ["_토큰 임베딩 행렬_", "_token embedding matrix_"],
    ["_위치 임베딩 행렬(position embedding matrix)_", "_position embedding matrix_"],
    ["_위치 임베딩 행렬_", "_position embedding matrix_"],
    ["평균 (μ)", "mean (μ)"],
    ["표준편차 (σ)", "std dev (σ)"],
    ["가중치 (γ)", "weight (γ)"],
    ["편향 (β)", "bias (β)"],
    ["정규화된 값", "normalized values"],
    ["입력 임베딩 행렬", "input embedding matrix"],
    ["정규화된 입력 임베딩(normalized input embedding)", "normalized input embedding"],
    ["정규화된 입력 임베딩", "normalized input embedding"],
    ["정규화된 입력 임베딩 행렬(normalized input embedding matrix)", "normalized input embedding matrix"],
    ["정규화된 입력 임베딩 행렬", "normalized input embedding matrix"],
    ["Q 벡터", "Q vector"],
    ["K 벡터", "K vectors"],
    ["V 벡터", "V vector"],
    ["Q 가중치 행렬", "Q-weight matrix"],
    ["입력 행렬", "input matrix"],
    ["어텐션 행렬", "attention matrix"],
    ["정규화된 셀프 어텐션 행렬", "normalized self-attention matrix"],
    ["출력 벡터", "output vectors"],
    ["편향", "bias"],
    ["선형 변환", "linear transformation"],
    ["레이어 정규화", "layer normalization"],
]);

const walkthroughEnglish = new Map<string, string>([
    ["GPT 대규모 언어 모델 가이드에 오신 것을 환영합니다! 여기서는 겨우 85,000개의 매개변수를 가진 _nano-gpt_ 모델을 살펴봅니다.", "Welcome to the walkthrough of the GPT large language model! Here we'll explore the model _nano-gpt_, with a mere 85,000 parameters."],
    ["이 모델의 목표는 단순합니다. 여섯 글자로 된 입력", "Its goal is a simple one: take a sequence of six letters:"],
    ["을 받아 알파벳 순서, 즉 \"ABBBCC\"로 정렬하는 것입니다.", "and sort them in alphabetical order, i.e. to \"ABBBCC\"."],
    ["3D 뷰에서 초록색 셀은 처리 중인 숫자를, 파란색 셀은 가중치를 나타냅니다.", "In the 3d view, each green cell represents a number being processed, and each blue cell is a weight."],
    ["시퀀스 안의 각 숫자는 먼저 48개 원소를 가진 벡터로 바뀝니다(이 크기는 이 모델에서 선택한 값입니다). 이것을 _임베딩(embedding)_이라고 합니다.", "Each number in the sequence first gets turned into a 48 element vector (a size chosen for this particular model). This is called an _embedding_."],
    ["그다음 임베딩은 모델의 다음 단계로 전달되며, 트랜스포머 블록이라고 부르는 여러 레이어를 차례로 통과합니다.", "The embedding is then passed through the model, going through a series of layers, called transformers, before reaching the bottom."],
    ["알고리즘의 세부로 들어가기 전에 잠시 한 걸음 물러서 보겠습니다.", "Before we delve into the algorithm's intricacies, let's take a brief step back."],
    ["이 가이드는 학습이 아니라 _추론(inference)_에 초점을 맞춥니다. 그래서 전체 머신러닝 과정 중 작은 일부만 다룹니다.", "This guide focuses on _inference_, not training, and as such is only a small part of the entire machine-learning process."],
    ["여기서는 이미 학습된 모델 가중치를 사용해 추론 과정으로 출력을 생성합니다. 이 과정은 브라우저 안에서 직접 실행됩니다.", "In our case, the model's weights have been pre-trained, and we use the inference process to generate output. This runs directly in your browser."],
    ["좋습니다. 이제 시작해 보겠습니다!", "Alright, let's get started!"],
    ["앞에서 간단한 룩업 테이블(lookup table)을 이용해 토큰이 정수 시퀀스로 매핑되는 과정을 봤습니다.", "We saw previously how the tokens are mapped to a sequence of integers using a simple lookup table."],
    ["이후부터는 부동소수점 수(소수)를 사용합니다.", "From here on out, we're using floats (decimal numbers)."],
    ["소프트맥스 연산은 이전 섹션에서 본 것처럼 셀프 어텐션의 일부로 사용되며, 모델의 맨 마지막에도 다시 등장합니다.", "The softmax operation is used as part of self-attention, as seen in the previous section, and it will also appear at the very end of the model."],
    ["이것으로 하나의 트랜스포머 블록이 완성되었습니다!", "And that's a complete transformer block!"],
]);

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
