/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs';
import * as path from 'path';
import { NotificationTemplates } from '../entities/notificationTemplates';

export class TemplateLoader {
    private templates: NotificationTemplates[] = [];

    load(): void {
        // When running from dist/ (compiled), __dirname is dist/templates/
        // but .mustache files live in src/templates/. Try dist first, fall back to src.
        let templatesDir = path.join(__dirname);
        const hasTemplates = fs.readdirSync(templatesDir).some(f =>
            fs.statSync(path.join(templatesDir, f)).isDirectory() && ['ses', 'slack', 'smtp'].includes(f)
        );
        if (!hasTemplates) {
            templatesDir = path.resolve(__dirname, '../../src/templates');
        }
        const channelTypes = fs.readdirSync(templatesDir).filter(f => {
            return fs.statSync(path.join(templatesDir, f)).isDirectory() && ['ses', 'slack', 'smtp'].includes(f);
        });

        let idCounter = 1;
        for (const channelType of channelTypes) {
            const channelDir = path.join(templatesDir, channelType);
            const nodeTypes = fs.readdirSync(channelDir).filter(f =>
                fs.statSync(path.join(channelDir, f)).isDirectory()
            );

            for (const nodeType of nodeTypes) {
                const nodeDir = path.join(channelDir, nodeType);
                const files = fs.readdirSync(nodeDir).filter(f => f.endsWith('.mustache'));

                for (const file of files) {
                    const eventTypeId = parseInt(path.basename(file, '.mustache'), 10);
                    if (isNaN(eventTypeId)) continue;

                    const payload = fs.readFileSync(path.join(nodeDir, file), 'utf8');
                    const tmpl = new NotificationTemplates();
                    tmpl.id = idCounter++;
                    tmpl.channel_type = channelType;
                    tmpl.node_type = nodeType;
                    tmpl.event_type_id = eventTypeId;
                    tmpl.template_name = `${channelType}_${nodeType}_${eventTypeId}`;
                    tmpl.template_payload = payload;
                    this.templates.push(tmpl);
                }
            }
        }
    }

    findByEventTypeIdAndNodeType(eventTypeId: number, nodeType: string): NotificationTemplates[] {
        return this.templates.filter(
            t => t.event_type_id === eventTypeId && t.node_type === nodeType
        );
    }

    findByEventTypeId(eventTypeId: number): NotificationTemplates[] {
        return this.templates.filter(t => t.event_type_id === eventTypeId);
    }

    findByEventTypeIdAndChannelType(eventTypeId: number, channelType: string): NotificationTemplates[] {
        return this.templates.filter(
            t => t.event_type_id === eventTypeId && t.channel_type === channelType
        );
    }
}
