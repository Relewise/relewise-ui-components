import { assert, aTimeout, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ContentResult } from '@relewise/client';
import { ContentTile, initializeRelewiseUI } from '../src';
import { stripHtmlClientSide } from '../src/helpers/templateHelpers';
import { mockRelewiseOptions } from './util/mockRelewiseUIOptions';

suite('stripHtmlClientSide', () => {
    teardown(() => {
        fixtureCleanup();
        window.relewiseUIOptions = undefined!;
    });

    test('extracts text and decodes entities without adding whitespace', () => {
        assert.equal(stripHtmlClientSide('<p>Hello <strong>world</strong> &amp; friends &#33;</p><p>Next</p>'), 'Hello world & friends !Next');
        assert.equal(stripHtmlClientSide('Plain text'), 'Plain text');
        assert.equal(stripHtmlClientSide(''), '');
        assert.equal(stripHtmlClientSide('<img alt="Image"><!-- comment -->'), '');
    });

    test('passes non-string values through unchanged', () => {
        const object = { value: '<p>Text</p>' };
        const array = ['<p>Text</p>'];
        assert.strictEqual(stripHtmlClientSide(object), object);
        assert.strictEqual(stripHtmlClientSide(array), array);
        assert.isUndefined(stripHtmlClientSide(undefined));
        assert.isNull(stripHtmlClientSide(null));
        assert.strictEqual(stripHtmlClientSide(42), 42);
        assert.strictEqual(stripHtmlClientSide(false), false);
    });

    test('does not construct registered custom elements', () => {
        let constructions = 0;
        const tag = `strip-html-probe-${crypto.randomUUID()}`;
        customElements.define(tag, class extends HTMLElement {
            constructor() {
                super();
                constructions++;
            }
        });

        assert.equal(stripHtmlClientSide(`<${tag}>Text</${tag}>`), 'Text');
        assert.equal(constructions, 0);
    });

    test('does not request images or execute their error handlers', async() => {
        const source = new URL('./util/mockRelewiseUIOptions.ts', import.meta.url);
        source.searchParams.set('strip-html-probe', crypto.randomUUID());
        let errors = 0;
        const onError = () => { errors++; };
        window.addEventListener('strip-html-image-error', onError);

        try {
            assert.equal(stripHtmlClientSide(`<img src="${source.href}" onerror="window.dispatchEvent(new Event('strip-html-image-error'))">Text`), 'Text');

            // A real local request confirms that resource timing is observable and
            // lets pending image work run before checking for parsing side effects.
            const controlSource = new URL(source);
            controlSource.searchParams.set('control', 'true');
            await fetch(controlSource);
            await aTimeout(100);

            assert.isNotEmpty(performance.getEntriesByName(controlSource.href, 'resource'));
            assert.isEmpty(performance.getEntriesByName(source.href, 'resource'));
            assert.equal(errors, 0);
        } finally {
            window.removeEventListener('strip-html-image-error', onError);
        }
    });

    test('keeps decoded markup as text in a custom content template', async() => {
        const options = mockRelewiseOptions();
        options.templates = {
            content: (content, { html, helpers }) => html`<p>${helpers.stripHtmlClientSide(content.data?.Summary?.value)}</p>`,
        };
        initializeRelewiseUI(options).useRecommendations();
        const content: ContentResult = {
            contentId: 'content',
            rank: 1,
            data: {
                Summary: { type: 'String', isCollection: false, value: '&lt;img src=x onerror="alert(1)"&gt;' },
            },
        };
        const element = await fixture<ContentTile>(html`<relewise-content-tile .content=${content}></relewise-content-tile>`);

        assert.equal(element.renderRoot.querySelector('p')?.textContent, '<img src=x onerror="alert(1)">');
        assert.isNull(element.renderRoot.querySelector('img'));
    });
});
