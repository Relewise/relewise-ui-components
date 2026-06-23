import { CSSResultGroup } from 'lit';

const lightDomStyleId = 'relewise-light-dom-styles';
const registeredStyles = new Map<string, string>();

export function registerLightDomStyles(tagName: string, styles: CSSResultGroup | undefined) {
    const cssText = getCssText(styles);
    if (!cssText || registeredStyles.has(tagName)) {
        return;
    }

    registeredStyles.set(tagName, scopeStyles(cssText, tagName));
    updateStyleElement();
}

export function clearRegisteredLightDomStylesForTesting() {
    registeredStyles.clear();
    document.getElementById(lightDomStyleId)?.remove();
}

function updateStyleElement() {
    let style = document.getElementById(lightDomStyleId) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement('style');
        style.id = lightDomStyleId;
        document.head.prepend(style);
    }

    style.textContent = Array.from(registeredStyles.values()).join('\n');
}

function getCssText(styles: CSSResultGroup | undefined): string {
    if (!styles) {
        return '';
    }

    if (Array.isArray(styles)) {
        return styles.map(getCssText).join('\n');
    }

    if ('cssText' in styles) {
        return styles.cssText;
    }

    return Array.from(styles.cssRules)
        .map(rule => rule.cssText)
        .join('\n');
}

function scopeStyles(cssText: string, tagName: string): string {
    let result = '';
    let index = 0;

    while (index < cssText.length) {
        const openBraceIndex = cssText.indexOf('{', index);
        if (openBraceIndex === -1) {
            result += cssText.slice(index);
            break;
        }

        const selector = cssText.slice(index, openBraceIndex).trim();
        const closeBraceIndex = findMatchingBrace(cssText, openBraceIndex);
        const content = cssText.slice(openBraceIndex + 1, closeBraceIndex);

        if (selector.startsWith('@media') || selector.startsWith('@supports') || selector.startsWith('@container')) {
            result += `${selector} {\n${scopeStyles(content, tagName)}\n}`;
        } else if (selector.startsWith('@')) {
            result += `${selector} {${content}}`;
        } else {
            result += `${scopeSelector(selector, tagName)} {${content}}`;
        }

        index = closeBraceIndex + 1;
    }

    return result;
}

function findMatchingBrace(cssText: string, openBraceIndex: number): number {
    let depth = 1;
    for (let index = openBraceIndex + 1; index < cssText.length; index++) {
        if (cssText[index] === '{') {
            depth++;
        }

        if (cssText[index] === '}') {
            depth--;
            if (depth === 0) {
                return index;
            }
        }
    }

    return cssText.length;
}

function scopeSelector(selector: string, tagName: string): string {
    return selector
        .split(',')
        .map(part => {
            const trimmed = part.trim();
            if (trimmed.includes(':host')) {
                return trimmed
                    .replace(/:host\(([^)]*)\)/g, `${tagName}$1`)
                    .replace(/:host/g, tagName);
            }

            return `${tagName} ${trimmed}`;
        })
        .join(', ');
}
