import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, DimStyle, IWalkthroughArgs, moveCameraTo, setInitialCamera } from "./WalkthroughTools";
import { lerp, lerpSmoothstep } from "@/src/utils/math";
import { processUpTo, startProcessBefore } from "./Walkthrough00_Intro";

export function walkthrough06_Projection(args: IWalkthroughArgs) {
    let { walkthrough: wt, state, layout, tools: { breakAfter, afterTime, c_blockRef, c_dimRef, cleanup } } = args;

    if (wt.phase !== Phase.Input_Detail_Projection) {
        return;
    }

    setInitialCamera(state, new Vec3(-73.167, 0.000, -270.725), new Vec3(293.606, 2.613, 1.366));
    let block = layout.blocks[0];
    wt.dimHighlightBlocks = [...block.heads.map(h => h.vOutBlock), block.projBias, block.projWeight, block.attnOut];

    let outBlocks = block.heads.map(h => h.vOutBlock);

    commentary(wt, null, 0)`

셀프 어텐션 과정이 끝나면 각 헤드에서 출력이 나옵니다. 이 출력은 Q와 K 벡터의 영향을 받아 적절히 섞인 V 벡터입니다.

각 헤드의 ${c_blockRef('출력 벡터', outBlocks)}를 합치기 위해 단순히 위아래로 쌓습니다. 따라서 시점
${c_dimRef('t = 4', DimStyle.T)}에서는 길이가 ${c_dimRef('A = 16', DimStyle.A)}인 벡터 3개가 길이 ${c_dimRef('C = 48', DimStyle.C)}인 벡터 1개가 됩니다.`;

    breakAfter();

    let t_fadeOut = afterTime(null, 1.0, 0.5);
    // let t_zoomToStack = afterTime(null, 1.0);
    let t_stack = afterTime(null, 1.0);

    breakAfter();

    commentary(wt)`

GPT에서는 한 헤드 안의 벡터 길이(${c_dimRef('A = 16', DimStyle.A)})가 ${c_dimRef('C', DimStyle.C)} / 헤드 수와 같다는 점이 중요합니다.
그래야 다시 쌓았을 때 원래 길이인 ${c_dimRef('C', DimStyle.C)}가 됩니다.

여기서부터는 레이어의 출력을 얻기 위해 프로젝션을 수행합니다. 이는 각 열마다 편향을 더한 단순한 행렬-벡터 곱입니다.`;

    breakAfter();

    let t_process = afterTime(null, 3.0);

    breakAfter();

    commentary(wt)`

이제 셀프 어텐션 레이어의 출력이 생겼습니다. 이 출력을 다음 단계로 바로 넘기는 대신, 입력 임베딩에 원소별로 더합니다.
초록색 세로 화살표로 표시된 이 과정을 _잔차 연결_ 또는 _잔차 경로_라고 부릅니다.
`;

    breakAfter();

    let t_zoomOut = afterTime(null, 1.0, 0.5);
    let t_processResid = afterTime(null, 3.0);

    cleanup(t_zoomOut, [t_fadeOut, t_stack]);

    breakAfter();

    commentary(wt)`

레이어 정규화와 마찬가지로, 잔차 경로는 깊은 신경망이 효과적으로 학습되도록 돕는 중요한 요소입니다.

이제 셀프 어텐션의 결과가 준비되었으니, 트랜스포머의 다음 부분인 피드포워드 네트워크로 넘길 수 있습니다.
`;

    breakAfter();

    if (t_fadeOut.active) {
        for (let head of block.heads) {
            for (let blk of head.cubes) {
                if (blk !== head.vOutBlock) {
                    blk.opacity = lerpSmoothstep(1, 0, t_fadeOut.t);
                }
            }
        }
    }

    if (t_stack.active) {
        let targetZ = block.attnOut.z;
        for (let headIdx = 0; headIdx < block.heads.length; headIdx++) {
            let head = block.heads[headIdx];
            let targetY = head.vOutBlock.y + head.vOutBlock.dy * (headIdx - block.heads.length + 1);
            head.vOutBlock.y = lerp(head.vOutBlock.y, targetY, t_stack.t);
            head.vOutBlock.z = lerp(head.vOutBlock.z, targetZ, t_stack.t);
        }
    }

    let processInfo = startProcessBefore(state, block.attnOut);

    if (t_process.active) {
        processUpTo(state, t_process, block.attnOut, processInfo);
    }

    moveCameraTo(state, t_zoomOut, new Vec3(-8.304, 0.000, -175.482), new Vec3(293.606, 2.623, 2.618));

    if (t_processResid.active) {
        processUpTo(state, t_processResid, block.attnResidual, processInfo);
    }
}
