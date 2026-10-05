/*
 * Compatibility selectors and selected behavior adapted from aopell/SchoologyPlus
 * commit 85e2e869678570179fba6ba554d5ca0b469ff3ec:
 * - src/styles/all.scss
 * - src/styles/modern/all.scss
 * - src/scripts/pages/all.ts
 *
 * Copyright (c) 2017-2024 Aaron Opell and Glen Husman
 * SPDX-License-Identifier: MIT
 * See THIRD_PARTY_NOTICES.md and docs/upstream-source-map.md.
 */

import type { NativeCustomization } from "../../shared/models";
import { effectiveNativeTokens, resolveForeground } from "../customization/native-theme";
import { isHomeRoute } from "../routes";

export interface SchoologyPlusCompatibilityCss {
  layoutCss: string;
  paintCss: string;
}

const NORMALIZED_ICON_ATTRIBUTE = "data-sc-original-header-icon-fill";
const NORMALIZED_ICON_CLASS = "sc-header-icon-normalized";

function pair(requested: string, background: string, customization: NativeCustomization): string {
  const tokens = effectiveNativeTokens(customization);
  return resolveForeground(
    requested,
    background,
    customization.contrastMode,
    [tokens.primaryText, tokens.headerText, tokens.link, tokens.mutedText],
    4.5
  ).resolved;
}

export function generateSchoologyPlusCompatibilityCss(
  customization: NativeCustomization,
  pathname: string
): SchoologyPlusCompatibilityCss {
  if (!customization.enabled) return { layoutCss: "", paintCss: "" };

  const tokens = effectiveNativeTokens(customization);
  const headerText = pair(tokens.headerText, tokens.headerBackground, customization);
  const headerHover = tokens.accent;
  const headerHoverText = pair(tokens.headerText, headerHover, customization);
  const menuBackground = tokens.elevatedSurface;
  const menuText = pair(tokens.primaryText, menuBackground, customization);
  const menuLink = pair(tokens.link, menuBackground, customization);
  const surfaceText = pair(tokens.primaryText, tokens.primarySurface, customization);
  const cardText = pair(tokens.primaryText, tokens.elevatedSurface, customization);
  const cardLink = pair(tokens.link, tokens.elevatedSurface, customization);
  const railText = pair(tokens.primaryText, tokens.rightRail, customization);
  const railLink = pair(tokens.link, tokens.rightRail, customization);

  const paint: string[] = [
    `html.sc-native-customized {
      --sc-splus-primary-color: ${tokens.headerBackground};
      --sc-splus-hover-color: ${headerHover};
      --sc-splus-contrast-text: ${headerText};
      --sc-splus-menu-background: ${menuBackground};
      --sc-splus-menu-text: ${menuText};
      --sc-splus-border: ${tokens.border};
      --sc-splus-focus: ${tokens.focusRing};
      --sc-splus-primary: ${tokens.pageBackground};
      --sc-splus-accent: ${tokens.primarySurface};
      --sc-splus-secondary: ${tokens.elevatedSurface};
      --sc-splus-text: ${surfaceText};
      --sc-splus-muted-text: ${tokens.mutedText};
      --sc-splus-radius: var(--sc-native-radius);
    }`,
    `html.sc-native-customized #header > header,
     html.sc-native-customized #header > header > nav,
     html.sc-native-customized #header > header nav li a._1Z0RM,
     html.sc-native-customized #header > header nav li button._1Z0RM,
     html.sc-native-customized #header > header nav [class*="Header-header-button-"],
     html.sc-native-customized #header > header nav [class*="StandardHeader-header-button-"] {
      background: var(--sc-splus-primary-color) !important;
      color: var(--sc-splus-contrast-text) !important;
    }`,
    `html.sc-native-customized #header > header nav li a._1Z0RM *,
     html.sc-native-customized #header > header nav li button._1Z0RM *,
     html.sc-native-customized #header > header nav [class*="Header-header-button-"] *,
     html.sc-native-customized #header > header nav [class*="StandardHeader-header-button-"] * {
      color: inherit !important;
    }`,
    `html.sc-native-customized #header > header nav li a._1Z0RM:hover:not(:active),
     html.sc-native-customized #header > header nav li a._1Z0RM:focus-visible,
     html.sc-native-customized #header > header nav li button._1Z0RM:hover:not(:active),
     html.sc-native-customized #header > header nav li button._1Z0RM:focus-visible,
     html.sc-native-customized #header > header nav [class*="Header-header-button-"]:hover:not(:active),
     html.sc-native-customized #header > header nav [class*="Header-header-button-"]:focus-visible,
     html.sc-native-customized #header > header nav [class*="StandardHeader-header-button-"]:hover:not(:active),
     html.sc-native-customized #header > header nav [class*="StandardHeader-header-button-"]:focus-visible,
     html.sc-native-customized #header > header nav [class*="Header-header-button-"][aria-expanded="true"],
     html.sc-native-customized #header > header nav [class*="StandardHeader-header-button-"][aria-expanded="true"],
     html.sc-native-customized #header > header nav li [aria-expanded="true"]._1Z0RM {
      background: ${headerHover} !important;
      color: ${headerHoverText} !important;
    }`,
    `html.sc-native-customized #header > header nav li a._1Z0RM:focus-visible,
     html.sc-native-customized #header > header nav li button._1Z0RM:focus-visible {
      outline: 3px solid var(--sc-splus-focus) !important;
      outline-offset: -3px !important;
    }`,
    `html.sc-native-customized #header > header nav svg {
      color: var(--sc-splus-contrast-text) !important;
    }`,
    `html.sc-native-customized #header > header nav [role="menu"],
     html.sc-native-customized #header > header ul.util-width-thirty-nine-1B-gb,
     html.sc-native-customized #header > header [class*="Header-header-drop-menu-"],
     html.sc-native-customized #header > header [class*="HeaderDropMenu-menu-border-"] {
      background: var(--sc-splus-menu-background) !important;
      color: var(--sc-splus-menu-text) !important;
      border-color: var(--sc-splus-border) !important;
    }`,
    `html.sc-native-customized #header > header nav [role="menu"] a,
     html.sc-native-customized #header > header nav [role="menu"] button,
     html.sc-native-customized #header > header [class*="Header-header-drop-menu-item-"],
     html.sc-native-customized #header > header [class*="Header-header-drop-menu-item-"] * {
      background: transparent !important;
      color: ${menuText} !important;
    }`,
    `html.sc-native-customized #header > header nav [role="menu"] a {
      color: ${menuLink} !important;
    }`,
    `html.sc-native-customized #header > header nav [role="menu"] a:hover,
     html.sc-native-customized #header > header nav [role="menu"] a:focus-visible,
     html.sc-native-customized #header > header nav [role="menu"] button:hover,
     html.sc-native-customized #header > header nav [role="menu"] button:focus-visible {
      background: ${tokens.control} !important;
      color: ${pair(tokens.primaryText, tokens.control, customization)} !important;
    }`
  ];

  const layout: string[] = [];
  if (isHomeRoute(pathname)) {
    paint.push(
      `html.sc-native-customized #body,
       html.sc-native-customized #main-content-wrapper {
        background-color: ${tokens.pageBackground} !important;
      }`,
      `html.sc-native-customized #center-top,
       html.sc-native-customized #center div#main,
       html.sc-native-customized #main-inner,
       html.sc-native-customized #home-feed-container {
        background-color: ${tokens.primarySurface} !important;
        color: ${surfaceText} !important;
      }`,
      `html.sc-native-customized #right-column {
        background-color: ${tokens.rightRail} !important;
        color: ${railText} !important;
      }`,
      `html.sc-native-customized #right-column-inner > div:not(:empty) {
        background-color: ${tokens.elevatedSurface} !important;
        color: ${cardText} !important;
      }`,
      `html.sc-native-customized #right-column-inner > div:not(:empty) a {
        color: ${railLink} !important;
      }`,
      `html.sc-native-customized .course-dashboard section.sgy-card,
       html.sc-native-customized .course-dashboard .course-dashboard__card-context {
        background-color: ${tokens.elevatedSurface} !important;
        color: ${cardText} !important;
      }`,
      `html.sc-native-customized .course-dashboard section.sgy-card a,
       html.sc-native-customized .course-dashboard .course-dashboard__card-context a,
       html.sc-native-customized .course-dashboard .course-dashboard__card-context-title {
        color: ${cardLink} !important;
      }`,
      `html.sc-native-customized .course-dashboard .course-dashboard__card-context .sgy-card-subcontext {
        color: ${pair(tokens.mutedText, tokens.elevatedSurface, customization)} !important;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card-lens .sgy-card-subcontext,
       html.sc-native-customized .course-dashboard .sgy-card-lens .course-dashboard__card-context {
        color: #ffffff !important;
      }`
    );
    layout.push(
      `html.sc-native-customized #main-content-wrapper,
       html.sc-native-customized #center,
       html.sc-native-customized #center-inner,
       html.sc-native-customized #center div#main,
       html.sc-native-customized #main-inner {
        min-width: 0 !important;
      }`,
      `html.sc-native-customized #main-content-wrapper {
        border: none !important;
      }`,
      `html.sc-native-customized #center-top {
        border: none !important;
      }`,
      `html.sc-native-customized .has-right-col #center-inner {
        background: none !important;
      }`,
      `html.sc-native-customized #right-column {
        flex-shrink: 0 !important;
      }`,
      `html.sc-native-customized #right-column-inner > div:not(:empty) {
        border: 1px solid var(--sc-splus-border) !important;
        border-radius: var(--sc-splus-radius) !important;
      }`,
      `html.sc-native-customized .course-dashboard section.sgy-card,
       html.sc-native-customized .course-dashboard .sgy-card-lens,
       html.sc-native-customized .course-dashboard .course-dashboard__card-context {
        border-radius: var(--sc-splus-radius) !important;
      }`,
      `html.sc-native-customized .course-dashboard section.sgy-card {
        display: flex !important;
        min-height: 18rem;
        flex-direction: column;
        overflow: hidden;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card-lens {
        position: relative;
        overflow: hidden;
        aspect-ratio: 16 / 9;
        min-height: 8rem;
        flex: 0 0 auto;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card-lens > img,
       html.sc-native-customized .course-dashboard .sgy-card-lens picture,
       html.sc-native-customized .course-dashboard .sgy-card-lens picture img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }`,
      `html.sc-native-customized .course-dashboard .course-dashboard__card-context:not(.sgy-card-lens) {
        position: relative !important;
        inset: auto !important;
        min-height: 5.25rem;
        padding: calc(0.9rem * var(--sc-native-space)) !important;
      }`,
      `html.sc-native-customized .course-dashboard .course-dashboard__card-context-title {
        display: -webkit-box;
        overflow: hidden;
        line-height: 1.3 !important;
        overflow-wrap: anywhere;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card-subcontext {
        margin-block-start: 0.4rem !important;
        line-height: 1.35 !important;
        overflow-wrap: anywhere;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card-lens:has(.sgy-card-subcontext)::after {
        position: absolute;
        z-index: 0;
        inset: 35% 0 0;
        background: linear-gradient(to bottom, transparent, rgb(0 0 0 / 88%));
        content: "";
        pointer-events: none;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card-lens > :is(.sgy-card-subcontext, .course-dashboard__card-context) {
        position: absolute;
        z-index: 1;
        right: 0;
        bottom: 0;
        left: 0;
        padding: 1rem !important;
        background: rgb(0 0 0 / 84%) !important;
        color: #ffffff !important;
        text-shadow: 0 1px 2px rgb(0 0 0 / 75%);
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card {
        border: 1px solid transparent !important;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card:hover {
        border-color: var(--sc-splus-border) !important;
      }`,
      `html.sc-native-customized .course-dashboard .sgy-card:hover .sgy-card-lens::after {
        display: none !important;
      }`
    );
  }

  return { layoutCss: layout.join("\n"), paintCss: paint.join("\n") };
}

export function normalizeSchoologyHeaderIcons(document: Document): void {
  for (const use of document.querySelectorAll<SVGUseElement>("#header header nav ul svg use")) {
    const href = use.getAttribute("href") ?? use.getAttribute("xlink:href");
    if (!href?.startsWith("#")) continue;
    const symbol = document.getElementById(href.slice(1));
    if (!symbol) continue;
    for (const path of symbol.querySelectorAll<SVGPathElement>("path")) {
      const fill = path.getAttribute("fill")?.trim();
      if (fill?.toLowerCase() !== "#333") continue;
      path.setAttribute(NORMALIZED_ICON_ATTRIBUTE, fill);
      path.setAttribute("fill", "currentColor");
      use.ownerSVGElement?.classList.add(NORMALIZED_ICON_CLASS);
    }
  }
}

export function restoreSchoologyHeaderIcons(document: Document): void {
  for (const path of document.querySelectorAll<SVGPathElement>(
    `path[${NORMALIZED_ICON_ATTRIBUTE}]`
  )) {
    path.setAttribute("fill", path.getAttribute(NORMALIZED_ICON_ATTRIBUTE) ?? "#333");
    path.removeAttribute(NORMALIZED_ICON_ATTRIBUTE);
  }
  for (const icon of document.querySelectorAll<SVGElement>(`.${NORMALIZED_ICON_CLASS}`)) {
    icon.classList.remove(NORMALIZED_ICON_CLASS);
  }
}
