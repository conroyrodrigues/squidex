/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
    AnalyticsService,
    ApiUrlConfig,
    HTTP,
    mapVersioned,
    pretifyError,
    Resource,
    ResourceLinks,
    Version,
    Versioned,
    withLinks
} from '@app/framework';

export type PatternsDto = Versioned<PatternsPayload>;
export type PatternsPayload = {
    items: PatternDto[]
} & Resource;

export class PatternDto {
    public readonly _links: ResourceLinks = {};

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly pattern: string,
        public readonly message?: string
    ) {
    }
}

export interface EditPatternDto {
    readonly name: string;
    readonly pattern: string;
    readonly message?: string;
}

@Injectable()
export class PatternsService {
    constructor(
        private readonly http: HttpClient,
        private readonly apiUrl: ApiUrlConfig,
        private readonly analytics: AnalyticsService
    ) {
    }

    public getPatterns(appName: string): Observable<PatternsDto> {
        const url = this.apiUrl.buildUrl(`api/apps/${appName}/patterns`);

        return HTTP.getVersioned(this.http, url).pipe(
            mapVersioned(({ body }) => {
                return parsePatterns(body);
            }),
            pretifyError('Failed to add pattern. Please reload.'));
    }

    public postPattern(appName: string, dto: EditPatternDto, version: Version): Observable<PatternsDto> {
        const url = this.apiUrl.buildUrl(`api/apps/${appName}/patterns`);

        return HTTP.postVersioned(this.http, url, dto, version).pipe(
            mapVersioned(({ body }) => {
                return parsePatterns(body);
            }),
            tap(() => {
                this.analytics.trackEvent('Patterns', 'Created', appName);
            }),
            pretifyError('Failed to add pattern. Please reload.'));
    }

    public putPattern(appName: string, resource: Resource, dto: EditPatternDto, version: Version): Observable<PatternsDto> {
        const link = resource._links['update'];

        const url = this.apiUrl.buildUrl(link.href);

        return HTTP.requestVersioned(this.http, link.method, url, version, dto).pipe(
            mapVersioned(({ body }) => {
                return parsePatterns(body);
            }),
            tap(() => {
                this.analytics.trackEvent('Patterns', 'Updated', appName);
            }),
            pretifyError('Failed to update pattern. Please reload.'));
    }

    public deletePattern(appName: string, resource: Resource, version: Version): Observable<PatternsDto> {
        const link = resource._links['delete'];

        const url = this.apiUrl.buildUrl(link.href);

        return HTTP.requestVersioned(this.http, link.method, url, version).pipe(
            mapVersioned(({ body }) => {
                return parsePatterns(body);
            }),
            tap(() => {
                this.analytics.trackEvent('Patterns', 'Configured', appName);
            }),
            pretifyError('Failed to remove pattern. Please reload.'));
    }
}

function parsePatterns(response: any) {
    const items: any[] = response.items;

    const patterns = items.map(item =>
        withLinks(
            new PatternDto(
                item.id,
                item.name,
                item.pattern,
                item.message),
            item));

    return withLinks({ items: patterns, _links: {} }, response);
}