import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const generatedPath = path.join(repoRoot, 'src/llm/locales/walkthroughEnglish.generated.json');
const write = process.argv.includes('--write');

const walkthroughFiles = childProcess.execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', 'upstream/main', 'src/llm/walkthrough'],
    { cwd: repoRoot, encoding: 'utf8' },
)
    .split(/\r?\n/)
    .filter(file => /\.(ts|tsx)$/.test(file))
    .filter(file => fs.existsSync(path.join(repoRoot, file)));

function gitShow(file) {
    return childProcess.execFileSync('git', ['show', `upstream/main:${file}`], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
    });
}

function normalize(value) {
    return value.replace(/\s+/g, ' ').trim();
}

function hasHangul(value) {
    return /[\uac00-\ud7a3]/.test(value);
}

function decodeStringLiteral(raw) {
    return raw
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\`/g, '`')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function readQuoted(source, quoteStart) {
    const quote = source[quoteStart];
    let raw = '';
    for (let i = quoteStart + 1; i < source.length; i++) {
        const ch = source[i];
        if (ch === '\\') {
            raw += ch + (source[i + 1] ?? '');
            i++;
            continue;
        }
        if (ch === quote) {
            return { value: decodeStringLiteral(raw), end: i + 1 };
        }
        raw += ch;
    }
    throw new Error(`Unclosed string literal near ${quoteStart}`);
}

function skipString(source, pos) {
    const quote = source[pos];
    for (let i = pos + 1; i < source.length; i++) {
        if (source[i] === '\\') {
            i++;
            continue;
        }
        if (source[i] === quote) {
            return i + 1;
        }
    }
    return source.length;
}

function skipTemplate(source, pos) {
    for (let i = pos + 1; i < source.length; i++) {
        if (source[i] === '\\') {
            i++;
            continue;
        }
        if (source[i] === '`') {
            return i + 1;
        }
        if (source[i] === '$' && source[i + 1] === '{') {
            i = skipExpression(source, i + 2) - 1;
        }
    }
    return source.length;
}

function skipExpression(source, pos) {
    let depth = 1;
    for (let i = pos; i < source.length; i++) {
        const ch = source[i];
        if (ch === '"' || ch === "'") {
            i = skipString(source, i) - 1;
            continue;
        }
        if (ch === '`') {
            i = skipTemplate(source, i) - 1;
            continue;
        }
        if (ch === '{') {
            depth++;
            continue;
        }
        if (ch === '}') {
            depth--;
            if (depth === 0) {
                return i + 1;
            }
        }
    }
    return source.length;
}

function readTemplateSegments(source, tickStart) {
    const segments = [];
    const expressions = [];
    let raw = '';
    for (let i = tickStart + 1; i < source.length; i++) {
        const ch = source[i];
        if (ch === '\\') {
            raw += ch + (source[i + 1] ?? '');
            i++;
            continue;
        }
        if (ch === '`') {
            segments.push(decodeStringLiteral(raw));
            return { segments, expressions, end: i + 1 };
        }
        if (ch === '$' && source[i + 1] === '{') {
            segments.push(decodeStringLiteral(raw));
            raw = '';
            const exprStart = i + 2;
            const exprEnd = skipExpression(source, exprStart);
            expressions.push(source.slice(exprStart, exprEnd - 1));
            i = exprEnd - 1;
            continue;
        }
        raw += ch;
    }
    throw new Error(`Unclosed template literal near ${tickStart}`);
}

function hasCommentaryTagBefore(source, tickStart) {
    const before = source.slice(Math.max(0, tickStart - 180), tickStart);
    return /(?:^|[\s=({;,])(?:commentary(?:Para\s*\([^`]*\))?(?:\s*\([^`\n;]*\))?)\s*$/.test(before);
}

function extractCommentaryTemplates(source, file) {
    const templates = [];
    for (let i = 0; i < source.length; i++) {
        if (source[i] !== '`' || !hasCommentaryTagBefore(source, i)) {
            continue;
        }
        const { segments, expressions, end } = readTemplateSegments(source, i);
        templates.push({ file, index: templates.length, value: segments, expressions, start: i, end });
        i = end - 1;
    }
    return templates;
}

function extractCallFirstStrings(source, file, name) {
    const items = [];
    const matcher = new RegExp(`\\b${name}\\s*\\(\\s*(['"\`])`, 'g');
    let match;
    while ((match = matcher.exec(source))) {
        const { value, end } = readQuoted(source, match.index + match[0].length - 1);
        if (normalize(value)) {
            items.push({ kind: 'text', file, pos: match.index, value });
        }
        matcher.lastIndex = end;
    }
    return items;
}

function extractTitles(source, file) {
    const items = [];
    const matcher = /\btitle\s*:\s*(['"`])/g;
    let match;
    while ((match = matcher.exec(source))) {
        const { value, end } = readQuoted(source, match.index + match[0].lastIndexOf(match[1]));
        if (normalize(value)) {
            items.push({ kind: 'text', file, pos: match.index, value });
        }
        matcher.lastIndex = end;
    }
    return items;
}

function extractJsxText(source, file) {
    const items = [];
    const matcher = />([^<>{}]*)</g;
    let match;
    while ((match = matcher.exec(source))) {
        const value = match[1];
        if (normalize(value)) {
            items.push({ kind: 'text', file, pos: match.index, value });
        }
    }
    return items;
}

function extractTextItems(source, file) {
    return [
        ...extractTitles(source, file),
        ...extractCallFirstStrings(source, file, 'c_str'),
        ...extractCallFirstStrings(source, file, 'c_blockRef'),
        ...extractCallFirstStrings(source, file, 'c_dimRef'),
        ...extractCallFirstStrings(source, file, 'localizeText'),
        ...extractJsxText(source, file),
    ].sort((a, b) => a.pos - b.pos);
}

function isInsideRange(pos, ranges) {
    return ranges.some(range => pos >= range.start && pos < range.end);
}

function extractStandaloneTextItems(source, file, templateRanges) {
    return extractTextItems(source, file).filter(item => !isInsideRange(item.pos, templateRanges));
}

function extractExpressionTextItems(source, file) {
    return [
        ...extractCallFirstStrings(source, file, 'c_str'),
        ...extractCallFirstStrings(source, file, 'c_blockRef'),
        ...extractCallFirstStrings(source, file, 'c_dimRef'),
        ...extractCallFirstStrings(source, file, 'localizeText'),
        ...extractJsxText(source, file),
    ].sort((a, b) => a.pos - b.pos);
}

function extractTextVariableBindings(source, file) {
    const bindings = new Map();
    const matcher = /\b(?:let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:c_str|c_blockRef|c_dimRef)\s*\(\s*(['"`])/g;
    let match;
    while ((match = matcher.exec(source))) {
        const { value, end } = readQuoted(source, match.index + match[0].length - 1);
        if (normalize(value)) {
            bindings.set(match[1], { kind: 'text', file, pos: match.index, value });
        }
        matcher.lastIndex = end;
    }
    return bindings;
}

function extractExpressionTextItemsWithBindings(source, file, bindings) {
    const directItems = extractExpressionTextItems(source, file);
    if (directItems.length > 0) {
        return directItems;
    }

    const boundItem = bindings.get(normalize(source));
    return boundItem ? [boundItem] : [];
}

function expressionSignature(source) {
    return source
        .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '$1__text__$1')
        .replace(/>([^<>{}]*)</g, '><')
        .replace(/\s+/g, ' ')
        .trim();
}

function expressionOrder(currentExpressions, upstreamExpressions) {
    const currentBySignature = new Map();
    currentExpressions.forEach((expression, index) => {
        const key = expressionSignature(expression);
        const items = currentBySignature.get(key) ?? [];
        items.push(index);
        currentBySignature.set(key, items);
    });

    return upstreamExpressions.map((expression, index) => {
        const key = expressionSignature(expression);
        const items = currentBySignature.get(key);
        return items?.shift() ?? index;
    });
}

function pairTextItems(currentItems, upstreamItems, file) {
    const entries = [];
    if (currentItems.length !== upstreamItems.length) {
        throw new Error(`${file} text shape differs: current=${currentItems.length} upstream=${upstreamItems.length}`);
    }

    for (let i = 0; i < currentItems.length; i++) {
        const source = normalize(currentItems[i].value);
        const target = normalize(upstreamItems[i].value);
        if (source && target && source !== target && hasHangul(source)) {
            entries.push([source, target]);
        }
    }

    return entries;
}

function partitionTextEntries(textEntries) {
    const targetsBySource = new Map();

    for (const [source, target] of textEntries) {
        const targets = targetsBySource.get(source) ?? new Set();
        targets.add(target);
        targetsBySource.set(source, targets);
    }

    const text = [];
    const ambiguousText = [];

    for (const [source, targets] of targetsBySource) {
        if (targets.size === 1) {
            text.push([source, [...targets][0]]);
        } else {
            ambiguousText.push([source, [...targets].sort((a, b) => a.localeCompare(b, 'en'))]);
        }
    }

    return {
        text: text.sort((a, b) => a[0].localeCompare(b[0], 'ko')),
        ambiguousText: ambiguousText.sort((a, b) => a[0].localeCompare(b[0], 'ko')),
    };
}

function makeExpectedData() {
    const templates = [];
    const textEntries = [];

    for (const file of walkthroughFiles) {
        const currentSource = fs.readFileSync(path.join(repoRoot, file), 'utf8');
        const upstreamSource = gitShow(file);
        const currentTemplates = extractCommentaryTemplates(currentSource, file);
        const upstreamTemplates = extractCommentaryTemplates(upstreamSource, file);
        const currentBindings = extractTextVariableBindings(currentSource, file);
        const upstreamBindings = extractTextVariableBindings(upstreamSource, file);

        if (currentTemplates.length !== upstreamTemplates.length) {
            throw new Error(`${file} commentary shape differs: current=${currentTemplates.length} upstream=${upstreamTemplates.length}`);
        }

        for (let i = 0; i < currentTemplates.length; i++) {
            const source = currentTemplates[i].value;
            const target = upstreamTemplates[i].value;
            if (source.length !== target.length) {
                throw new Error(`${file} commentary template ${i} chunk count differs: current=${source.length} upstream=${target.length}`);
            }
            if (currentTemplates[i].expressions.length !== upstreamTemplates[i].expressions.length) {
                throw new Error(`${file} commentary template ${i} expression count differs: current=${currentTemplates[i].expressions.length} upstream=${upstreamTemplates[i].expressions.length}`);
            }
            const order = expressionOrder(currentTemplates[i].expressions, upstreamTemplates[i].expressions);
            const valueText = new Array(upstreamTemplates[i].expressions.length).fill(null);

            for (let exprIdx = 0; exprIdx < upstreamTemplates[i].expressions.length; exprIdx++) {
                const currentExprIdx = order[exprIdx];
                const expressionTextPairs = pairTextItems(
                    extractExpressionTextItemsWithBindings(currentTemplates[i].expressions[currentExprIdx], file, currentBindings),
                    extractExpressionTextItemsWithBindings(upstreamTemplates[i].expressions[exprIdx], file, upstreamBindings),
                    `${file} template ${i} expression ${exprIdx}`,
                );
                textEntries.push(...expressionTextPairs);
                if (expressionTextPairs.length === 1) {
                    valueText[exprIdx] = expressionTextPairs[0][1];
                }
            }

            if (source.some(hasHangul)) {
                templates.push({ key: source.map(normalize), en: target, valueOrder: order, valueText });
            }
        }

        textEntries.push(...pairTextItems(
            extractStandaloneTextItems(currentSource, file, currentTemplates),
            extractStandaloneTextItems(upstreamSource, file, upstreamTemplates),
            file,
        ));
    }

    const { text, ambiguousText } = partitionTextEntries(textEntries);

    return {
        templates,
        text,
        ambiguousText,
    };
}

function loadGeneratedData() {
    if (!fs.existsSync(generatedPath)) {
        throw new Error(`Missing generated localization data: ${path.relative(repoRoot, generatedPath)}`);
    }

    const data = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
    if (!data || !Array.isArray(data.templates) || !Array.isArray(data.text)) {
        throw new Error('Generated localization data must be { templates, text }.');
    }
    return data;
}

function templateKey(source) {
    return JSON.stringify(source.map(normalize));
}

function main() {
    const expected = makeExpectedData();

    if (write) {
        fs.mkdirSync(path.dirname(generatedPath), { recursive: true });
        fs.writeFileSync(generatedPath, `${JSON.stringify(expected, null, 2)}\n`);
        console.log(`Wrote ${expected.templates.length} templates and ${expected.text.length} text fallback entries.`);
        return;
    }

    const generated = loadGeneratedData();
    const generatedTemplates = new Map(generated.templates.map(item => [templateKey(item.key), item.en]));
    const generatedTemplateOrders = new Map(generated.templates.map(item => [templateKey(item.key), item.valueOrder]));
    const generatedTemplateValueText = new Map(generated.templates.map(item => [templateKey(item.key), item.valueText ?? []]));
    const generatedTexts = new Map(generated.text.map(([source, target]) => [normalize(source), normalize(target)]));
    const missingTemplates = [];
    const mismatchedTemplates = [];
    const missingTexts = [];
    const mismatchedTexts = [];
    const ambiguousTextsInFallback = [];
    const unhandledAmbiguousTextTargets = [];

    for (const expectedTemplate of expected.templates) {
        const key = templateKey(expectedTemplate.key);
        const actual = generatedTemplates.get(key);
        if (!actual) {
            missingTemplates.push(expectedTemplate.key);
            continue;
        }
        if (JSON.stringify(actual.map(normalize)) !== JSON.stringify(expectedTemplate.en.map(normalize))) {
            mismatchedTemplates.push(expectedTemplate.key);
        }
        const actualOrder = generatedTemplateOrders.get(key);
        if (JSON.stringify(actualOrder) !== JSON.stringify(expectedTemplate.valueOrder)) {
            mismatchedTemplates.push(expectedTemplate.key);
        }
        const actualValueText = generatedTemplateValueText.get(key);
        if (JSON.stringify(actualValueText) !== JSON.stringify(expectedTemplate.valueText)) {
            mismatchedTemplates.push(expectedTemplate.key);
        }
    }

    for (const [source, target] of expected.text) {
        const actual = generatedTexts.get(source);
        if (!actual) {
            missingTexts.push(source);
        } else if (actual !== target) {
            mismatchedTexts.push(source);
        }
    }

    for (const [source] of expected.ambiguousText) {
        if (generatedTexts.has(source)) {
            ambiguousTextsInFallback.push(source);
        }
    }

    const contextualTextTargets = new Set();
    for (const expectedTemplate of expected.templates) {
        for (const target of expectedTemplate.valueText) {
            if (target) {
                contextualTextTargets.add(normalize(target));
            }
        }
    }

    const phaseTitleTargets = new Set([
        'Introduction',
        'Overview',
        'Preliminary',
        'Detailed',
        'Embedding',
        'Layer Norm',
        'Self Attention',
        'Projection',
        'Transformer',
        'Softmax',
        'Output',
    ].map(normalize));

    for (const [source, targets] of expected.ambiguousText) {
        for (const target of targets) {
            if (!contextualTextTargets.has(normalize(target)) && !phaseTitleTargets.has(normalize(target))) {
                unhandledAmbiguousTextTargets.push(`${source} => ${target}`);
            }
        }
    }

    const languageSource = fs.readFileSync(path.join(repoRoot, 'src/llm/Language.tsx'), 'utf8');
    const commentarySource = fs.readFileSync(path.join(repoRoot, 'src/llm/Commentary.tsx'), 'utf8');
    const usesTemplateApi = languageSource.includes('localizeTemplate') && commentarySource.includes('localizeTemplate');
    const usesReactNodeApi = languageSource.includes('localizeReactNode') && commentarySource.includes('localizeReactNode');
    const usesValueText = languageSource.includes('valueText') && commentarySource.includes('valueText');

    if (
        missingTemplates.length > 0 ||
        mismatchedTemplates.length > 0 ||
        missingTexts.length > 0 ||
        mismatchedTexts.length > 0 ||
        ambiguousTextsInFallback.length > 0 ||
        unhandledAmbiguousTextTargets.length > 0 ||
        !usesTemplateApi ||
        !usesReactNodeApi ||
        !usesValueText
    ) {
        console.error(`Expected templates: ${expected.templates.length}`);
        console.error(`Expected text fallback entries: ${expected.text.length}`);
        console.error(`Ambiguous text entries: ${expected.ambiguousText.length}`);
        if (!usesTemplateApi) {
            console.error('Commentary rendering is not using localizeTemplateStrings.');
        }
        if (!usesReactNodeApi) {
            console.error('Commentary rendering is not using localizeReactNode.');
        }
        if (!usesValueText) {
            console.error('Commentary rendering is not using template-specific valueText entries.');
        }
        if (missingTemplates.length > 0) {
            console.error(`Missing templates: ${missingTemplates.length}`);
            for (const source of missingTemplates.slice(0, 5)) {
                console.error(`  - ${JSON.stringify(source)}`);
            }
        }
        if (mismatchedTemplates.length > 0) {
            console.error(`Mismatched templates: ${mismatchedTemplates.length}`);
        }
        if (missingTexts.length > 0) {
            console.error(`Missing text entries: ${missingTexts.length}`);
            for (const source of missingTexts.slice(0, 20)) {
                console.error(`  - ${source}`);
            }
        }
        if (mismatchedTexts.length > 0) {
            console.error(`Mismatched text entries: ${mismatchedTexts.length}`);
        }
        if (ambiguousTextsInFallback.length > 0) {
            console.error(`Ambiguous text entries must not use global fallback: ${ambiguousTextsInFallback.length}`);
            for (const source of ambiguousTextsInFallback.slice(0, 20)) {
                console.error(`  - ${source}`);
            }
        }
        if (unhandledAmbiguousTextTargets.length > 0) {
            console.error(`Ambiguous text targets are not covered by valueText or phase title localization: ${unhandledAmbiguousTextTargets.length}`);
            for (const source of unhandledAmbiguousTextTargets.slice(0, 20)) {
                console.error(`  - ${source}`);
            }
        }
        process.exit(1);
    }

    console.log(`English localization coverage OK: ${expected.templates.length} templates, ${expected.text.length} text fallback entries, ${expected.ambiguousText.length} ambiguous entries.`);
}

main();
