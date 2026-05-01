import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough08_Transformer(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Transformer) {
        return;
    }

    setInitialCamera(state, new Vec3(-135.531, 0.000, -353.905), new Vec3(291.100, 13.600, 5.706));

    let c0 = commentary(wt, null, 0)`

이것으로 하나의 트랜스포머 블록이 완성되었습니다!

GPT 모델의 대부분은 이런 블록들로 이루어지며, 여러 번 반복됩니다. 한 블록의 출력은 다음 블록의 입력이 되고,
잔차 경로도 계속 이어집니다.

딥러닝에서 흔히 그렇듯 각 레이어가 정확히 무엇을 하는지 단정하기는 어렵지만, 대략적인 경향은 알려져 있습니다.
앞쪽 레이어는 더 낮은 수준의 특징과 패턴을 배우는 경향이 있고, 뒤쪽 레이어는 더 높은 수준의 추상화와 관계를 인식하고 이해합니다.
자연어 처리 맥락에서는 낮은 레이어가 문법, 구문, 단순한 단어 연관성을 배울 수 있고, 높은 레이어는 더 복잡한 의미 관계,
담화 구조, 문맥 의존적 의미를 포착할 수 있습니다.

`;

}
