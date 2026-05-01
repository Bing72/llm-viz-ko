import React from "react";
import { findSubBlocks, splitGrid } from "../Annotations";
import { drawDataFlow } from "../components/DataFlow";
import { drawDependences } from "../Interaction";
import { clamp } from "@/src/utils/data";
import { lerp } from "@/src/utils/math";
import { Dim, Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { processUpTo, startProcessBefore } from "./Walkthrough00_Intro";
import { commentary, DimStyle, IWalkthroughArgs, moveCameraTo, setInitialCamera } from "./WalkthroughTools";

export function walkthrough03_LayerNorm(args: IWalkthroughArgs) {
    let { walkthrough: wt, layout, state, tools: { afterTime, c_str, c_blockRef, c_dimRef, breakAfter, cleanup } } = args;
    let { C } = layout.shape;

    if (wt.phase !== Phase.Input_Detail_LayerNorm) {
        return;
    }

    let ln = layout.blocks[0].ln1;

    setInitialCamera(state, new Vec3(-6.680, 0.000, -65.256), new Vec3(281.000, 9.000, 2.576));
    wt.dimHighlightBlocks = [layout.residual0, ...ln.cubes];

    commentary(wt, null, 0)`

이전 섹션에서 만든 ${c_blockRef('_입력 임베딩_', state.layout.residual0)} 행렬은 첫 번째 트랜스포머 블록의 입력이 됩니다.

트랜스포머 블록의 첫 단계는 이 행렬에 _레이어 정규화_를 적용하는 것입니다. 이는 행렬의 각 열 값을
각각 따로 정규화하는 연산입니다.`;
    breakAfter();

    let t_moveCamera = afterTime(null, 1.0);
    let t_hideExtra = afterTime(null, 1.0, 1.0);
    let t_moveInputEmbed = afterTime(null, 1.0);
    let t_moveCameraClose = afterTime(null, 0.5);

    breakAfter();
    commentary(wt)`
정규화는 깊은 신경망 학습에서 중요한 단계이며, 학습 중 모델의 안정성을 높이는 데 도움이 됩니다.

각 열을 따로 볼 수 있으므로, 지금은 4번째 열(${c_dimRef('t = 3', DimStyle.T)})에 집중해 보겠습니다.`;

    breakAfter();
    let t_focusColumn = afterTime(null, 0.5);

    // mu ascii: \u03bc
    // sigma ascii: \u03c3
    breakAfter();
    commentary(wt)`
목표는 열 안의 평균값을 0으로, 표준편차를 1로 만드는 것입니다. 이를 위해 해당 열의
${c_blockRef('평균 (\u03bc)', ln.lnAgg1)}과 ${c_blockRef('표준편차 (\u03c3)', ln.lnAgg2)}를 구한 뒤, 평균을 빼고 표준편차로 나눕니다.`;

    breakAfter();

    let t_calcMuAgg = afterTime(null, 0.5);
    let t_calcVarAgg = afterTime(null, 0.5);

    // 1e-5 as 1x10^-5, but with superscript: 1x10<sup>-5</sup>

    breakAfter();
    commentary(wt)`
여기서는 길이가 ${c_dimRef('C', DimStyle.C)}인 열의 평균을 E[x], 분산을 Var[x]로 표기합니다.
분산은 표준편차를 제곱한 값입니다. 엡실론 항(ε = ${<>1&times;10<sup>-5</sup></>})은 0으로 나누는 일을 막기 위해 들어갑니다.

이 값들은 열 안의 모든 값에 적용되므로, 집계 레이어에서 계산해 저장합니다.

마지막으로 정규화된 값을 얻으면, 열의 각 원소에 학습된
${c_blockRef('가중치 (\u03b3)', ln.lnSigma)}를 곱하고 ${c_blockRef('편향 (β)', ln.lnMu)} 값을 더해 ${c_blockRef('정규화된 값', ln.lnResid)}을 만듭니다.`;

    breakAfter();

    let t_clean_aggs = afterTime(null, 0.2);
    cleanup(t_clean_aggs, [t_calcMuAgg, t_calcVarAgg]);
    let t_colSequence = afterTime(null, 2.0);

    breakAfter();
    commentary(wt)`
${c_blockRef('입력 임베딩 행렬', layout.residual0)}의 각 열에 이 정규화 연산을 실행하면
${c_blockRef('정규화된 입력 임베딩', ln.lnResid)}이 만들어지고, 이는 셀프 어텐션 레이어로 전달될 준비가 됩니다.
`;

    breakAfter();
    let t_cleanupSplits = afterTime(null, 0.5);
    cleanup(t_cleanupSplits, [t_focusColumn]);
    if (t_cleanupSplits.t > 0) {
        t_colSequence.t = 0;
    }
    let t_runAggFull = afterTime(null, 2.0);
    let t_runNormFull = afterTime(null, 6.0);

    moveCameraTo(state, t_moveCamera, new Vec3(21.2, 0, -102.9), new Vec3(281.5, 11, 1.7));

    let exampleIdx = 3;
    let ln1 = layout.blocks[0].ln1;
    let inputBlock = layout.residual0;

    inputBlock.highlight = lerp(0, 0.3, t_hideExtra.t);

    let relevantBlocks = new Set([
        layout.residual0,
        ...ln1.cubes,
    ]);

    for (let blk of layout.cubes) {
            if (!relevantBlocks.has(blk)) {
            blk.opacity = lerp(1.0, 0.0, t_hideExtra.t);
        }
    }

    for (let blk of relevantBlocks) {
        if (blk != layout.residual0 && blk.t !== 'w') {
            blk.access!.disable = true;
        }
    }

    let startResidualY = layout.residual0.y;
    let endResidulY = ln1.lnResid.y;
    layout.residual0.y = lerp(startResidualY, endResidulY, t_moveInputEmbed.t);

    if (t_moveInputEmbed.t >= 0.0) {
        inputBlock.highlight = lerp(0.3, 0.0, t_moveInputEmbed.t);
    }

    moveCameraTo(state, t_moveCameraClose, new Vec3(-14.1, 0, -187.1), new Vec3(270, 4, 0.7));

    let splitAmt = lerp(0.0, 2.0, t_focusColumn.t);
    let splitPos = exampleIdx + 0.5;

    let otherColOpacity = lerp(1.0, 0.3, t_focusColumn.t);
    ln1.lnAgg1.opacity = otherColOpacity;
    ln1.lnAgg2.opacity = otherColOpacity;
    ln1.lnResid.opacity = otherColOpacity;
    inputBlock.opacity = otherColOpacity;

    if (t_focusColumn.t > 0) {
        let aggMuCol = splitGrid(layout, ln1.lnAgg1, Dim.X, splitPos, splitAmt)!;
        let aggVarCol = splitGrid(layout, ln1.lnAgg2, Dim.X, splitPos, splitAmt)!;
        let residCol = splitGrid(layout, ln1.lnResid, Dim.X, splitPos, splitAmt)!;
        let inputCol = splitGrid(layout, inputBlock, Dim.X, splitPos, splitAmt)!;
        aggMuCol.opacity = 1.0;
        aggVarCol.opacity = 1.0;
        residCol.opacity = 1.0;
        inputCol.opacity = 1.0;

        let aggDestIdx = new Vec3(exampleIdx, 0, 0);
        if (t_calcMuAgg.t > 0.0) {
            let pinIdx = new Vec3(0, 10, 0);
            drawDependences(state, ln1.lnAgg1, aggDestIdx);
            drawDataFlow(state, ln1.lnAgg1, aggDestIdx, pinIdx);
            aggMuCol.access!.disable = false;
            inputCol.highlight = 0.3;
        }

        if (t_calcVarAgg.t > 0.0) {
            let pinIdx = new Vec3(9, 9, 0);
            drawDependences(state, ln1.lnAgg2, aggDestIdx);
            drawDataFlow(state, ln1.lnAgg2, aggDestIdx, pinIdx);
            aggVarCol.access!.disable = false;
        }

        if (t_colSequence.t > 0.0) {
            aggMuCol.access!.disable = false;
            aggVarCol.access!.disable = false;

            let pinIdx = new Vec3(-10, 0, 0);

            let cPos = t_colSequence.t * C;
            let cIdx = clamp(Math.floor(cPos), 0, C - 1);
            let destIdx = new Vec3(exampleIdx, cIdx, 0);
            drawDependences(state, ln1.lnResid, destIdx);
            drawDataFlow(state, ln1.lnResid, destIdx, pinIdx);

            let targetCell = splitGrid(layout, residCol, Dim.Y, cIdx + 0.5, 0.0)!;
            targetCell.highlight = 0.3;

            findSubBlocks(residCol, Dim.Y, 0, cIdx).forEach((blk) => {
                blk.access!.disable = false;
            });
        }
    }

    if (t_runAggFull.t > 0.0) {
        try {
            let processInfo = startProcessBefore(state, ln1.lnAgg1);
            processUpTo(state, t_runAggFull, ln1.lnAgg2, processInfo);
            processUpTo(state, t_runNormFull, ln1.lnResid, processInfo);
        } catch (e) {
            console.log(e);
        }
    }
}
