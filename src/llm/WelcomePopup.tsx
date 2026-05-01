'use client';

import React from 'react';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createContext, useContext, useEffect } from 'react';
import { assignImm } from '@/src/utils/data';
import { KeyboardOrder, useGlobalKeyboard } from '@/src/utils/keyboard';
import { useLocalStorageState } from '@/src/utils/localstorage';
import { ModalWindow } from '@/src/utils/Portal';
import s from './WelcomePopup.module.scss';
import { TocDiagram } from './components/TocDiagram';
import { Subscriptions, useSubscriptions } from '../utils/hooks';
import { localizedLabel, useLanguage } from './Language';

interface IWelcomePopupLS {
    visible: boolean;
}

function hydrateWelcomePopupLS(a?: Partial<IWelcomePopupLS>) {
    return {
        visible: a?.visible ?? true,
    };
}

export const WelcomePopup: React.FC<{}> = () => {
    let ctx = useContext(WelcomeContext);
    let { language } = useLanguage();
    useSubscriptions(ctx.subscriptions);
    let [welcomeState, setWelcomeState] = useLocalStorageState('welcome-popup', hydrateWelcomePopupLS);

    useGlobalKeyboard(KeyboardOrder.Modal, ev => {

        if (ev.key === 'Escape') {
            hide();
        }

        ev.stopPropagation();
    });

    useEffect(() => {
        if (ctx.forceVisible) {
            ctx.forceVisible = false;
            setWelcomeState(a => assignImm(a, { visible: true }));
        }
    }, [ctx, setWelcomeState, ctx.forceVisible]);

    function hide() {
        setWelcomeState(a => assignImm(a, { visible: false }));
    }

    if (!welcomeState.visible) {
        return null;
    }

    return <ModalWindow className={s.modalWindow} backdropClassName={s.modalWindowBackdrop} onBackdropClick={hide}>
        <div className={s.header}>
            <div className={s.title}>{localizedLabel(language, 'Welcome!', '환영합니다!')}</div>
        </div>
        <div className={s.body}>
            {/* <div className={s.image}>
                <Image src={IntroImage} alt={"LLM diagram"} />
            </div> */}
            <div style={{ width: 600, flex: '0 0 auto' }}>
                <TocDiagram activePhase={null} onEnterPhase={hide} />
            </div>
            <div className={s.text}>
                {language === 'en' ? <>
                    <p>This is an interactive 3D Visualization of a Large Language Model (LLM),
                        of the likes that powers GPT-3 & ChatGPT.</p>
                    <p>We show a very small model of the same design, to help you understand how
                        these models work.</p>
                    <p>As well as being interactive, we provide a walkthrough of the model
                        showing the step-by-step process of how it works, with every single add, multiply &
                        math operation described.</p>
                </> : <>
                    <p>이 페이지는 GPT-3나 ChatGPT 같은 대규모 언어 모델(LLM)이 어떻게 동작하는지 보여 주는
                        인터랙티브 3D 시각화입니다.</p>
                    <p>같은 구조를 가진 아주 작은 모델을 예로 들어, LLM 내부에서 실제로 어떤 계산이 일어나는지
                        이해할 수 있게 구성했습니다.</p>
                    <p>모델을 직접 살펴볼 수 있을 뿐 아니라, 더하기와 곱하기를 포함한 각 수학 연산이 어떤 순서로
                        이어지는지 단계별 안내로 따라가 볼 수 있습니다.</p>
                </>}
            </div>
        </div>
        <div className={s.footer}>
            <button className={s.button} onClick={hide}>{localizedLabel(language, 'Get Started', '시작하기')}</button>
        </div>
    </ModalWindow>;
};

class WelcomeManager {
    subscriptions = new Subscriptions();
    forceVisible = false;
    showWelcomeDialog() {
        this.forceVisible = true;
        this.subscriptions.notify();
    }
}

let WelcomeContext = createContext(new WelcomeManager());

export const InfoButton: React.FC<{}> = () => {
    let ctx = useContext(WelcomeContext);

    return <div onClick={() => ctx.showWelcomeDialog()} className={s.infoBtn}>
        <FontAwesomeIcon icon={faCircleQuestion} />
    </div>;
};
