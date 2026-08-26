const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function trapFocusInDialog(event: KeyboardEvent, dialog: HTMLElement): void {
    if (event.key !== 'Tab') {
        return;
    }

    const focusableElements = getFocusableElements(dialog);
    if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
    }

    const activeElement = getDeepActiveElement();
    const activeIndex = activeElement ? focusableElements.indexOf(activeElement) : -1;
    const shouldWrapBackward = event.shiftKey && activeIndex <= 0;
    const shouldWrapForward = !event.shiftKey && (activeIndex === -1 || activeIndex === focusableElements.length - 1);

    if (!shouldWrapBackward && !shouldWrapForward) {
        return;
    }

    event.preventDefault();
    focusableElements[shouldWrapBackward ? focusableElements.length - 1 : 0].focus();
}

function getFocusableElements(root: ParentNode): HTMLElement[] {
    const focusableElements: HTMLElement[] = [];

    root.querySelectorAll<HTMLElement>('*').forEach(element => {
        if (element.matches(focusableSelector) && !element.hidden && element.getClientRects().length > 0) {
            focusableElements.push(element);
        }
        if (element.shadowRoot) {
            focusableElements.push(...getFocusableElements(element.shadowRoot));
        }
    });

    return focusableElements;
}

function getDeepActiveElement(): HTMLElement | null {
    let activeElement = document.activeElement;
    while (activeElement?.shadowRoot?.activeElement) {
        activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement instanceof HTMLElement ? activeElement : null;
}
