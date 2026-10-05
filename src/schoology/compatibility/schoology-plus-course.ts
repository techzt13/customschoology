/*
 * Course-shell selectors and selected visual behavior adapted from aopell/SchoologyPlus
 * commit 85e2e869678570179fba6ba554d5ca0b469ff3ec:
 * - src/styles/modern/all.scss
 * - src/scripts/pages/course.ts
 * - src/scripts/pages/materials.ts
 * - src/scripts/pages/material.ts
 * - src/scripts/pages/page.ts
 * - src/scripts/pages/grades.ts
 *
 * Copyright (c) 2017-2024 Aaron Opell and Glen Husman
 * SPDX-License-Identifier: MIT
 * See THIRD_PARTY_NOTICES.md and docs/upstream-source-map.md.
 */

import type { NativeCustomization } from "../../shared/models";
import {
  AUTHORED_READING_LINK,
  AUTHORED_READING_SURFACE,
  AUTHORED_READING_TEXT,
  effectiveNativeTokens,
  resolveForeground
} from "../customization/native-theme";
import { isCourseExperienceRoute } from "../routes";
import type { SchoologyPlusCompatibilityCss } from "./schoology-plus-shell";

function paired(
  requested: string,
  background: string,
  customization: NativeCustomization,
  threshold = 4.5
): string {
  const tokens = effectiveNativeTokens(customization);
  return resolveForeground(
    requested,
    background,
    customization.contrastMode,
    [tokens.primaryText, tokens.headerText, tokens.link, tokens.mutedText],
    threshold
  ).resolved;
}

export function generateSchoologyPlusCourseCss(
  customization: NativeCustomization,
  pathname: string
): SchoologyPlusCompatibilityCss {
  if (!customization.enabled || !isCourseExperienceRoute(pathname)) {
    return { layoutCss: "", paintCss: "" };
  }

  const tokens = effectiveNativeTokens(customization);
  const pageText = paired(tokens.primaryText, tokens.pageBackground, customization);
  const surfaceText = paired(tokens.primaryText, tokens.primarySurface, customization);
  const surfaceLink = paired(tokens.link, tokens.primarySurface, customization);
  const elevatedText = paired(tokens.primaryText, tokens.elevatedSurface, customization);
  const elevatedLink = paired(tokens.link, tokens.elevatedSurface, customization);
  const leftText = paired(tokens.primaryText, tokens.leftRail, customization);
  const leftLink = paired(tokens.link, tokens.leftRail, customization);
  const rightText = paired(tokens.primaryText, tokens.rightRail, customization);
  const rightLink = paired(tokens.link, tokens.rightRail, customization);
  const activeText = paired(tokens.primaryText, tokens.accent, customization);
  const controlText = paired(tokens.primaryText, tokens.control, customization);

  const paintCss = `
    html.sc-native-customized body[data-sc-route] {
      background-color: ${tokens.pageBackground} !important;
      color: ${pageText} !important;
    }
    html.sc-native-customized body[data-sc-route] :is(#wrapper, #body, #main-content-wrapper) {
      background-color: ${tokens.pageBackground} !important;
      color: ${pageText} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(#center-top, #center-top .content-top-upper, #center-top .page-title, #center-top .course-title) {
      background: ${tokens.primarySurface} !important;
      color: ${surfaceText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(#center div#main, #main-inner, #content-wrapper) {
      background-color: ${tokens.primarySurface} !important;
      color: ${surfaceText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(#center div#main, #main-inner, #content-wrapper)
      a:not([data-status], [data-grade], [class*="status" i], [class*="grade" i]):not(
        :where(
          #important-post-body a,
          .info-container a,
          .s-page-content-full a,
          .s-page-summary a,
          .user-generated-content a,
          .material-content a,
          .assignment-content a,
          .instructions-content a,
          .folder-description a,
          .item-info a
        )
      ) {
      color: ${surfaceLink} !important;
    }
    html.sc-native-customized body[data-sc-route] #sidebar-left {
      background-color: ${tokens.leftRail} !important;
      color: ${leftText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route] #sidebar-left a {
      background-color: transparent !important;
      color: ${leftLink} !important;
    }
    html.sc-native-customized body[data-sc-route]
      #sidebar-left
      :is(#left-nav, #menu-s-main)
      a:is(.active, [aria-current="page"]),
    html.sc-native-customized body[data-sc-route]
      #sidebar-left
      #menu-s-main
      .active-trail
      .active-trail
      a.course-materials-left-menu {
      background-color: ${tokens.accent} !important;
      color: ${activeText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route]
      #sidebar-left
      :is(#left-nav, #menu-s-main)
      a:hover,
    html.sc-native-customized body[data-sc-route]
      #sidebar-left
      :is(#left-nav, #menu-s-main)
      a:focus-visible {
      background-color: ${tokens.control} !important;
      color: ${controlText} !important;
    }
    html.sc-native-customized body[data-sc-route] :is(.course-title, .page-title) {
      color: ${surfaceText} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(.materials-top, .materials-filter-wrapper, .action-links) {
      background-color: ${tokens.elevatedSurface} !important;
      color: ${elevatedText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(.materials-filter-wrapper, .action-links)
      :is(a, button, .action-links-unfold) {
      color: ${elevatedLink} !important;
    }
    html.sc-native-customized body[data-sc-route] #course-profile-materials {
      background-color: ${tokens.primarySurface} !important;
      color: ${surfaceText} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(
        #course-profile-materials > [class*="type-"],
        #course-profile-materials > .material-row,
        #folder-contents-table tr,
        .materials-list > li
      ) {
      background-color: ${tokens.elevatedSurface} !important;
      color: ${elevatedText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(
        #course-profile-materials > [class*="type-"],
        #course-profile-materials > .material-row,
        #folder-contents-table tr,
        .materials-list > li
      )
      a {
      color: ${elevatedLink} !important;
    }
    html.sc-native-customized body[data-sc-route] #right-column {
      background-color: ${tokens.rightRail} !important;
      color: ${rightText} !important;
    }
    html.sc-native-customized body[data-sc-route] #right-column-inner > div:not(:empty),
    html.sc-native-customized body[data-sc-route] #right-column-inner > section:not(:empty) {
      background-color: ${tokens.elevatedSurface} !important;
      color: ${elevatedText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route] #right-column :is(h2, h3, h4) {
      color: ${elevatedText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route] #right-column a {
      color: ${rightLink} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(div.summary-course, .gradebook-course.hierarchical-grading-report) {
      background: ${AUTHORED_READING_SURFACE} !important;
      color: ${AUTHORED_READING_TEXT} !important;
      border-color: ${tokens.border} !important;
      color-scheme: light;
    }
    html.sc-native-customized body[data-sc-route]
      :is(div.summary-course, .gradebook-course.hierarchical-grading-report)
      a {
      color: ${AUTHORED_READING_LINK} !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(
        #important-post-body,
        #main-inner .info-container,
        #content-wrapper .info-container,
        .standard-page .s-page-content-full,
        .s-page-summary,
        .user-generated-content,
        .material-content,
        .assignment-content,
        .instructions-content,
        .folder-description,
        .item-info
      ) {
      background: ${AUTHORED_READING_SURFACE} !important;
      color: ${AUTHORED_READING_TEXT} !important;
      border-color: ${tokens.border} !important;
      color-scheme: light;
    }
    html.sc-native-customized body[data-sc-route]
      :is(
        #important-post-body,
        #main-inner .info-container,
        #content-wrapper .info-container,
        .standard-page .s-page-content-full,
        .s-page-summary,
        .user-generated-content,
        .material-content,
        .assignment-content,
        .instructions-content,
        .folder-description,
        .item-info
      )
      a {
      color: ${AUTHORED_READING_LINK} !important;
    }
    html.sc-native-customized body[data-sc-route] #main-content-wrapper :is(button, select, textarea, input:not([type="checkbox"]):not([type="radio"]), .link-btn, [role="button"]):not([data-status], [data-grade], [class*="status" i], [class*="grade" i]):not(:where([data-sc-region="authored-content"] *)) {
      background-color: ${tokens.control} !important;
      color: ${controlText} !important;
      border-color: ${tokens.border} !important;
    }
    html.sc-native-customized body[data-sc-route] #main-content-wrapper input:is([type="checkbox"], [type="radio"]) {
      accent-color: ${tokens.accent};
    }
    html.sc-native-customized body[data-sc-route] #main-content-wrapper :is(button, select, textarea, input, .link-btn, [role="button"]):focus-visible {
      outline: 3px solid ${tokens.focusRing} !important;
      outline-offset: 2px !important;
    }
  `;

  const layoutCss = `
    html.sc-native-customized body[data-sc-route]
      :is(#main-content-wrapper, #center, #center-inner, #center div#main, #main-inner, #content-wrapper) {
      min-width: 0 !important;
    }
    html.sc-native-customized body[data-sc-route] #main-content-wrapper {
      border: none !important;
    }
    html.sc-native-customized body[data-sc-route] #center-top {
      border: none !important;
    }
    html.sc-native-customized body[data-sc-route] .has-right-col #center-inner {
      background: none !important;
    }
    html.sc-native-customized body[data-sc-route] #right-column {
      min-width: 0 !important;
      flex-shrink: 0 !important;
    }
    html.sc-native-customized body[data-sc-route] #right-column-inner > div:not(:empty),
    html.sc-native-customized body[data-sc-route] #right-column-inner > section:not(:empty) {
      border: 1px solid var(--sc-native-border) !important;
      border-radius: var(--sc-native-radius) !important;
      padding: calc(0.8rem * var(--sc-native-space)) !important;
    }
    html.sc-native-customized body[data-sc-route] .course-image {
      overflow: hidden;
      border-radius: var(--sc-native-radius) !important;
    }
    html.sc-native-customized body[data-sc-route] .course-image img {
      display: block;
      max-width: 100%;
      height: auto;
      object-fit: cover;
    }
    html.sc-native-customized body[data-sc-route]
      :is(.materials-top, .materials-filter-wrapper, .action-links) {
      border: 1px solid var(--sc-native-border) !important;
      border-radius: var(--sc-native-radius) !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(
        #course-profile-materials > [class*="type-"],
        #course-profile-materials > .material-row,
        #folder-contents-table tr,
        .materials-list > li
      ) {
      border: 1px solid var(--sc-native-border) !important;
      border-radius: var(--sc-native-radius) !important;
    }
    html.sc-native-customized body[data-sc-route]
      :is(div.summary-course, .gradebook-course.hierarchical-grading-report) {
      overflow-x: auto;
      padding: calc(1rem * var(--sc-native-space)) !important;
      border: 1px solid var(--sc-native-border) !important;
      border-radius: var(--sc-native-radius) !important;
    }
    html.sc-native-customized body[data-sc-route] #main-content-wrapper :is(button, select, textarea, input:not([type="checkbox"]):not([type="radio"]), .link-btn, [role="button"]):not(:where([data-sc-region="authored-content"] *)) {
      min-height: 2.5rem;
      border: 1px solid var(--sc-native-border) !important;
      border-radius: var(--sc-native-radius) !important;
      padding: 0.5rem 0.75rem !important;
      font: inherit;
    }
  `;

  return { layoutCss, paintCss };
}
