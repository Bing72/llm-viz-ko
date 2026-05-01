import React from 'react';
import { Phase } from "./Walkthrough";
import { commentary, embed, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";
import s from './Walkthrough.module.scss';
import { Vec3 } from '@/src/utils/vector';

let minGptLink = 'https://github.com/karpathy/minGPT';
let pytorchLink = 'https://pytorch.org/';
let andrejLink = 'https://karpathy.ai/';
let zeroToHeroLink = 'https://karpathy.ai/zero-to-hero.html';

export function walkthrough01_Prelim(args: IWalkthroughArgs) {
    let { state, walkthrough: wt } = args;

    if (wt.phase !== Phase.Intro_Prelim) {
        return;
    }

    setInitialCamera(state, new Vec3(184.744, 0.000, -636.820), new Vec3(296.000, 16.000, 13.500));

    let c0 = commentary(wt, null, 0)`
알고리즘의 세부로 들어가기 전에 잠시 한 걸음 물러서 보겠습니다.

이 가이드는 학습이 아니라 _추론(inference)_에 초점을 맞춥니다. 그래서 전체 머신러닝 과정 중 작은 일부만 다룹니다.
여기서는 이미 학습된 모델 가중치를 사용해 추론 과정으로 출력을 생성합니다. 이 과정은 브라우저 안에서 직접 실행됩니다.

여기서 보여 주는 모델은 GPT(generative pre-trained transformer) 계열에 속하며, “문맥 기반 토큰 예측기”라고 설명할 수 있습니다.
OpenAI는 2018년에 이 계열을 소개했고, 대표적인 모델로 GPT-2, GPT-3, GPT-3.5 Turbo가 있습니다. GPT-3.5 Turbo는 널리 사용된 ChatGPT의 기반이었습니다.
GPT-4와도 관련이 있을 수 있지만 구체적인 세부 사항은 공개되어 있지 않습니다.

이 가이드는 ${embedLink('Andrej Karpathy', andrejLink)}가 만든 ${embedLink('PyTorch', pytorchLink)} 기반의 최소 GPT 구현인
${embedLink('minGPT', minGptLink)} GitHub 프로젝트에서 영감을 받았습니다.
그의 YouTube 시리즈 ${embedLink("Neural Networks: Zero to Hero", zeroToHeroLink)}와 minGPT 프로젝트는 이 가이드를 만드는 데 큰 참고 자료가 되었습니다.
여기에 등장하는 장난감 모델도 minGPT 프로젝트 안의 모델을 바탕으로 합니다.

좋습니다. 이제 시작해 보겠습니다!
`;

}

export function embedLink(a: React.ReactNode, href: string) {
    return embedInline(<a className={s.externalLink} href={href} target="_blank" rel="noopener noreferrer">{a}</a>);
}

export function embedInline(a: React.ReactNode) {
    return { insertInline: a };
}


// Another similar model is BERT (bidirectional encoder representations from transformers), a "context-aware text encoder" commonly
// used for tasks like document classification and search.  Newer models like Facebook's LLaMA (large language model architecture), continue to use
// a similar transformer architecture, albeit with some minor differences.
